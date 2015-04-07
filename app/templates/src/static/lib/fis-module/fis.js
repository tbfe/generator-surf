(function() {
    var F = {
        'version': '2.0.0',
        'debug': false
    };

    var config = {
        baseUrl: undefined
    };

    function forEach(o, fn) {
        if (o instanceof Array) {
            for (var i = 0, l = o.length; i < l; i++) {
                if (fn.call(o[i], o[i], i) === false) {
                    return;
                }
            }
        } else {
            for (var i in o) {
                if (o.hasOwnProperty(i)) {
                    if (fn.call(o[i], o[i], i) === false) {
                        return;
                    }
                }
            }
        }
    }

    function indexOf(arr, item) {
        if (Array.prototype.indexOf) {
            return arr.indexOf(item);
        }

        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === item) {
                return i;
            }
        }
        return -1;
    }

    function filter(arr, fn) {
        if (Array.prototype.filter) {
            return arr.filter(fn);
        }

        var ret = [];
        forEach(arr, function(item, i, arr) {
            if (fn(item, i, arr)) {
                ret.push(item);
            }
        });
        return ret;
    }
    /**
     * 如果依赖关系如下 a -> [b -> [c -> [a, e], d]]
     * 处理c模块的依赖关系的时候，调用 removeCyclicDeps(c, [a, e])
     * return [e]
     */
    function removeCyclicDeps(uri, deps) {
        return filter(deps, function(dep) {
            return !Module.loadingPaths[dep] || !isCyclicWaiting(Module.cache[dep], uri, []);
        });
    }

    function isCyclicWaiting(mod, uri, track) {
        if (!mod || mod._loaded)
            return false;
        track.push(mod.name);
        var deps = mod.deps || [];
        if (deps.length) {
            if (indexOf(deps, uri) > -1) {
                return true;
            } else {
                for (var i = 0; i < deps.length; i++) {
                    if (indexOf(track, deps[i]) < 0 && isCyclicWaiting(Module.cache[deps[i]], uri, track)) {
                        return true;
                    }
                }
                return false;
            }
        }
        return false;
    }
    //模块类
    function Module(path, name) {
        // 模块名，在define时指定
        this.name = name;
        // 模块js文件全路径
        this.path = path;
        // 模块函数
        this.fn = null;
        // 模块对象
        this.exports = {};
        // 包括依赖是否都下载完成
        this._loaded = false;
        // 完成后需要触发的函数
        this._requiredStack = [];
        this._readyStack = [];
        // 保存实例，用于单实例判断
        Module.cache[this.name] = this;
    }

    // 已经下载完成的js文件
    Module.loadedPaths = {};
    // 正在下载的
    Module.loadingPaths = {};
    // 初始化进行中
    Module.initingPaths = {};
    // 模块实例
    Module.cache = {};
    // 模块前缀路径
    Module.paths = {};
    // 文件模块路径映射，对于多个模块打包在一个js文件中时通过这个map查找对应的路径
    Module.moduleFileMap = {};

    Module.requiredPaths = {};
    Module.lazyLoadPaths = {};

    //模块prototype定义
    Module.prototype = {
        //初始化，执行factory函数
        init: function() {
            if (!this._inited) {
                this._inited = true;
                if (!this.fn) {
                    throw new Error('Module "' + this.name + '" not found!');
                }
                var result;
                Module.initingPaths[this.name] = true;
                if (result = this.fn.call(null, require, this.exports)) {
                    this.exports = result;
                }
                Module.initingPaths[this.name] = false;
            }
        },
        //加载模块
        load: function() {
            Module.loadingPaths[this.path] = true;
            var path = Module.moduleFileMap[this.name] || this.path;
            Script.create({
                src: path
            });
        },
        lazyLoad: function() {
            var name = this.name,
                path = this.path;
            if (Module.lazyLoadPaths[name]) {
                this.define();
                delete Module.lazyLoadPaths[name];
            } else {
                if (Module.loadedPaths[path]) {
                    this.triggerStack();
                } else if (!Module.loadingPaths[path]) {
                    Module.requiredPaths[this.name] = true;
                    this.load();
                }
            }
        },
        //模块加载完成
        ready: function(fn, isRequired) {
            var stack = isRequired ? this._requiredStack : this._readyStack;
            if (fn) {
                if (this._loaded) {
                    this.init();
                    fn();
                } else {
                    stack.push(fn);
                }
            } else {
                this._loaded = true;
                Module.loadedPaths[this.path] = true;
                delete Module.loadingPaths[this.path];
                this.triggerStack();
            }
        },
        triggerStack: function() {
            if (this._readyStack.length > 0) {
                this.init();
                forEach(this._readyStack, function(func) {
                    if (!func.doing) {
                        func.doing = true;
                        func();
                    }
                });
                this._readyStack = [];
            }

            if (this._requiredStack.length > 0) {
                forEach(this._requiredStack, function(func) {
                    if (!func.doing) {
                        func.doing = true;
                        func();
                    }
                });
                this._requiredStack = [];
            }
        },
        //定义模块
        define: function() {
            var _this = this,
                deps = this.deps,
                depPaths = [];
            if (!deps && F.debug) {
                this.deps = getDependents(_this.fn);
            }

            //清除循环依赖
            deps = removeCyclicDeps(_this.path, this.deps);

            if (deps.length) {
                Module.loadingPaths[this.path] = true;
                forEach(deps, function(d) {
                    var mod = get(d);
                    depPaths.push(mod.path);
                });
                forEach(deps, function(d) {
                    var mod = get(d);
                    mod.ready(function() {
                        if (isPathsLoaded(depPaths)) {
                            _this.ready();
                        }
                    }, true);
                    mod.lazyLoad();
                });
            } else {
                this.ready();
            }
        }
    };
    //实现模块的require方法
    function require(name) {
        var mod = get(name);
        if (!Module.initingPaths[name]) { //清除循环依赖
            mod.init();
        }
        return mod.exports;
    }
    //检查给定的路径数组是否都加载完成
    function isPathsLoaded(paths) {
        var r = true;
        forEach(paths, function(path) {
            if (!(path in Module.loadedPaths)) {
                return r = false;
            }
        });
        return r;
    }

    //根据名称获取js文件路径
    function getJsPath(name) {
        return config.baseUrl ? (config.baseUrl + name) : name;
    }

    //根据名称和路径获取模块实例
    function get(name) {
        var path = name.indexOf(':') > -1 ? name : getJsPath(name);
        if (Module.cache[name]) {
            return Module.cache[name];
        }
        return new Module(path, name);
    }

    var Stylesheet = {
        //保存已经发起请求的path路径
        _paths: [],
        //保存域名信息
        _domain: [],

        create: function(opt){
            if(opt.src in this._paths){
                return;
            }
            this._paths[opt.src] = true;
            var head = document.getElementsByTagName('head')[0];
            var node = document.createElement('link');
            opt.charset && (node.charset = opt.charset);
            node.href = this._domain + '/' + opt.src;
            node.rel = 'stylesheet';
            head.insertBefore(node, head.firstChild);
        },
        //设置CSS域名
        setDomain: function(domain) {
            this._domain = domain;
        }
    }

    var Script = {
        //发起script请求
        create: function(opt) {
            if (opt.src in this._paths) {
                return;
            }
            this._paths[opt.src] = true;
            forEach(this._rules, function(modify) {
                modify.call(null, opt);
            });
            var head = document.getElementsByTagName('head')[0];
            var node = document.createElement('script');
            node.type = opt.type || 'text/javascript';
            opt.charset && (node.charset = opt.charset);
            node.src = opt.src;
            node.onload = node.onerror = node.onreadystatechange = function() {
                if ((!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                    // Ensure only run once and handle memory leak in IE
                    node.onload = node.onerror = node.onreadystatechange = null;
                    // Remove the script to reduce memory leak
                    if (node.parentNode && !F.debug) {
                        head.removeChild(node)
                    }
                    // Dereference the node
                    node = undefined;
                    opt.loaded && opt.loaded();
                }
            };
            head.insertBefore(node, head.firstChild);
        },
        //保存已经发起请求的path路径
        _paths: {},

        //保存路径规则函数
        _rules: [],

        //增加路径规则
        addPathRule: function(modify) {
            this._rules.push(modify);
        }
    };
    /**
     * 指定一个或多个模块名，待模块加载完成后执行回调函数，并将模块对象依次传递给函数作为参数。
     * @function
     * @public
     * @name F.use
     * @grammar F.use(moduleName, callback)
     * @param {String|Array} moduleName 模块名
     * @param {Function} callback 回调函数
     * @version 1.0
     */
    F.use = function(names, fn) {
        if (typeof names === 'string') {
            names = [names];
        }
        var args = [];
        var flags = [];
        forEach(names, function(name, i) {
            flags[i] = false;
        });
        forEach(names, function(name, i) {
            var mod = get(name);
            mod.ready(function() {
                args[i] = mod.exports;
                flags[i] = true;
                var done = true;
                forEach(flags, function(f) {
                    if (f === false) {
                        return done = false;
                    }
                });
                if (fn && done) {
                    fn.apply(null, args);
                }
            });
            mod.lazyLoad();
        });
    };

    /**
     * 加载模块的CSS文件
     * @function
     * @public
     * @name F.loadCss
     * @param path         加载的模块名
     * @version 1.0
     * @author           yaodongwei
     *
     */
    F.loadCss = function(path){
        Stylesheet.create({ //创建对应JS模块的CSS地址，并异步加载
            src: path
        });
    },

    //用于在回调中异步加载模块
    require.async = F.use;

    /**
     * 禁止使用该接口，该接口存在是由于老代码在使用
     * @inner
     */
    F.require = require;

    /**
     * 声明一个模块。
     * 一个模块的名字需要符合以下规范：
     * <ol>
     * <li>框架基础模块名，是模块js文件路径截去前面"http://...lib/"和文件名"name.js";</li>
     * <li>用户模块名，需要以一个前缀来表示属于自己的模块，比如模块名"ps/common/name",其中"ps"表示该模块是自己的，同时在源文件配置文件中定义模块对应的存放路径；"common/name"部分为文件路径的目录名称;</li>
     * <li>每个模块对应的js文件路径为"模块根目录/模块层级目录/模块名目录/模块名.js"</li>
     * </ul>
     *
     * @function
     * @public
     * @name F.module
     * @grammar F.module(name, fn)
     * @param {String} name 模块名
     * @param {Function} fn 模块定义函数，有两个参数分别为"require","exports"。"require"是一个函数，用来引用其他模块；"exports"是一个对象，模块函数最终将模块的api挂载到exports这个对象上，作为模块对外的输出唯一对象。
     * @param {Array} deps 请不要使用这个参数，module 老代码有用
     */
    F.module = function(name, fn, deps) {
        var mod = get(name);
        mod.fn = fn;
        mod.deps = deps || [];
        if (Module.requiredPaths[name]) {
            mod.define();
        } else {
            Module.lazyLoadPaths[name] = true;
        }
    };
    /**
     * 自定义模块文件路径
     *
     * @function
     * @public
     * @name F.pathRule
     * @grammar F.pathRule(modify)
     * @param {Function} modify 修改模块请求的路径，可以方便用来避免模块缓存和路径调试，该函数拥有一个参数，框架计算出的模块路径。
     * @version 1.0
     * @example
     * 可以通过下面方法来避免模块缓存，每次模块加载时，路径后面加上时间戳。
     * <code>
     * F.pathRule(function(opt){
     *     opt.path = opt.path + '?' + new Date().getTime();
     * });
     * </code>
     */
    F.pathRule = function(modify) {
        Script.addPathRule(modify);
    };
    F.setDomain = function(domain){
        Stylesheet.setDomain(domain);
    };
    /**
     * 增加js文件和模块名的映射。可以通过此方法来调整一个或多个模块实际请求的js路径。
     *
     * @function
     * @private
     * @name F._fileMap
     * @grammar F._fileMap(path, names)
     * @param {String|Object} path js的文件全路径或 路径-模块名 映射对象
     * @param {String|Array} names 单个模块名或者多个模块名数组
     * @version 1.0
     */
    F._fileMap = function(path, names) {
        if (typeof path === 'object') {
            forEach(path, function(ns, p) {
                F._fileMap(p, ns);
            });
        } else {
            if (typeof names === 'string') {
                names = [names];
            }
            forEach(names, function(name) {
                Module.moduleFileMap[name] = path;
            });
        }
    };

    F.config = function(option) {
        var baseUrl = option['baseUrl'];
        if (typeof baseUrl === 'string') {
            if (baseUrl && baseUrl.charAt(baseUrl.length - 1) == '/') {
                baseUrl = baseUrl.substr(0, baseUrl.length - 1);
            }
            config.baseUrl = baseUrl;
        }
    };

    'F' in window || (window.F = F);
})();