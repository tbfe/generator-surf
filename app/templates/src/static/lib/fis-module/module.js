var _ = _ || {};
$.extend(_, (function() {

    /**
     * 消息中心
     * @type {{eventPool: (*|jQuery|HTMLElement), observe: Function, fire: Function, stopObserving: Function}}
     */
    var MessageManager = {
        debug: false,
        eventPool: $({}),

        observe: function() {
            this.eventPool.bind.apply(this.eventPool, arguments);
        },

        fire: function() {
            this.eventPool.trigger.apply(this.eventPool, arguments);
        },

        stopObserving: function() {
            this.eventPool.unbind.apply(this.eventPool, arguments);
        }
    };

    /**
     * AopManager
     *
     */
    var AopManager = {
        pointCuts: {},

        /**
         * 添加一个切面通知
         * @param {String} path
         * @param {String} method
         * @param {String} type 通知类型,包括 before, after, around, afterThrow
         * @param {Function} advice
         */
        addAdvice: function (path, method, type, advice) {
            if (this.pointCuts[path] === undefined) {
                this.pointCuts[path] = {};
            }
            if (this.pointCuts[path][method] === undefined) {
                this.pointCuts[path][method] = [];
            }
            this.pointCuts[path][method].push({
                type: type,
                advice: advice
            });
        },

        /**
         * 将通知插入到指定的类中，添加后会删除掉已经被添加的通知
         * @param path
         * @param clazz
         */
        inject: function (path, clazz) {
            var pointCuts = this.pointCuts[path];
            if (pointCuts) {
                for (var methodName in pointCuts) {
                    var methodAdvices = pointCuts[methodName];
                    var methodAdvice;
                    while (methodAdvice = methodAdvices.shift()) {
                        $.aop[methodAdvice.type]({
                            target: clazz,
                            method: methodName
                        }, methodAdvice.advice);
                    }
                }
                this.clear(path);
            }
        },

        clear: function (path) {
            delete this.pointCuts[path];
        }
    };

    /***
     * @desc 用于生成类的函数
     * @param {Object} properties 类的成员属性和方法集
     * @return JS类对象
     */
    var Class = function(properties) {
        if (!properties.hasOwnProperty('initial') || !$.isFunction(properties.initial)) {
            properties.initial = new Function();
        }
        var _getProperties = function(properties) {
            var result = {
                'noMethod': {},
                'method': {}
            };
            for (var i in properties) {
                if (i == 'prototype') continue;
                if ($.isFunction(properties[i])) {
                    result.method[i] = properties[i];
                } else if ($.isArray(properties[i])) {
                    result.noMethod[i] = Array.prototype.slice.call(properties[i], 0);
                } else if ($.isPlainObject(properties[i])) {
                    result.noMethod[i] = $.extend({}, properties[i]);
                } else {
                    result.noMethod[i] = properties[i];
                }
            }
            return result;
        };

        var _class = function() {
            var _propObj = _getProperties(properties);
            $.extend(this, _propObj.noMethod);
            if (_class.prototype.initial && $.isFunction(_class.prototype.initial)) {
                _class.prototype.initial.apply(this, arguments);
            }
        };
        /***
         * @desc 类继承方法
         * @param {Object} prop 新类的成员属性集合
         * @return 新的类对象
         */
        _class.extend = function(prop) {
            var _prototype = _class.prototype;
            var __prop = {};
            $.extend(__prop, _prototype, prop);
            var _newClass = Class(__prop);
            $.extend(_newClass.prototype, {
                "__parent__": function(propName) {
                    var self = this;
                    if (!_prototype.hasOwnProperty(propName)) return;
                    return ($.isFunction(_prototype[propName])) ? function() {
                        _prototype[propName].apply(self, arguments);
                    } : _prototype[propName];
                },
                "__super__": function() {
                    //alert(this.parent('initial'));
                    return this.__parent__('initial').apply(this, arguments);
                }
            });
            return _newClass;
        };

        $.extend(_class.prototype, properties, {
            'prototype': _class.prototype
        });
        return _class;
    };
    /***
     * @class 事件类
     */

    var Event = Class({
        type: '', //事件类型
        target: null, //目标对象
        /**
         * @desc 构造函数
         * @param {String} 事件类型
         * @param {Object} 事件目标
         */
        initial: function(eventType, target) {
            this.type = eventType;
            this.target = target;
        }
    });
    /***
     * @class 事件分发类
     */
    var Dispatcher = Class({
        _eventStack: {},
        initial: function() {},
        /***
         * @desc 绑定事件
         * @param {String} eventType        事件类型
         * @param {Function} eventHandler       事件处理函数
         * @param {Object} context
         */
        bind: function(eventType, eventHandler, context) {
            if (!this._eventStack.hasOwnProperty(eventType)) {
                this._eventStack[eventType] = [];
            }
            this._eventStack[eventType].push({
                'handler': eventHandler,
                'context': context
            });
        },
        /***
         * @desc 绑定事件
         * @param {String} eventType        事件类型
         * @param {Function} eventHandler       事件处理函数
         */
        unbind: function(eventType, eventHandler) {
            if (!this._eventStack.hasOwnProperty(eventType)) {
                return;
            }
            //如果没有传入具体的事件处理函数 则删除所有该eventType绑定
            if (!eventHandler || !$.isFunction(eventHandler)) {
                delete this._eventStack[eventType];
                return;
            }
            var _eventStack = this._eventStack[eventType];
            for (var i = 0, len = _eventStack.length; i < len; i++) {
                if (_eventStack[i]['handler'] == eventHandler) {
                    _eventStack.splice(i, 1);
                    break;
                }
            }
        },
        /***
         * @desc 事件分发
         * @param {String} eventType 事件类型
         */
        trigger: function(eventType) {
            if (!this._eventStack.hasOwnProperty(eventType) || !this._eventStack[eventType].length)
                return;

            var _evt = new Event(eventType, this);
            var _args = Array.prototype.slice.call(arguments, 0),
                _tempStack = [];
            _args.shift();
            _args = [_evt].concat(_args);

            if (this._eventStack[eventType]) {
                _tempStack = Array.prototype.slice.call(this._eventStack[eventType]);
            }

            for (var i = 0, stack = _tempStack, len = _tempStack.length; i < len; i++) {
                if (!stack || !stack[i]) {
                    continue;
                }
                var obj = stack[i],
                    fn = obj['handler'],
                    ctx = obj['context'] || null;
                if (fn && $.isFunction(fn)) {
                    fn.apply(ctx, _args);
                }
            }
        },

        observe: function() {
            MessageManager.observe.apply(MessageManager, arguments);
        },

        stopObserving: function() {
            MessageManager.stopObserving.apply(MessageManager, arguments);
        },

        fire: function() {
            MessageManager.fire.apply(MessageManager, arguments);
        }
    });
    /***
     * 可以继承的白名单
     */
    var extendsWhiteList = {
        'component': ['component'],
        'widget': ['widget'],
        'controller': []
    };
    /***
     * 可以引用的白名单
     */
    var requireWhiteList = {
        'component': ['component', 'widget'], //临时加入运行component require widget，以后component要下掉
        'widget': ['component', 'widget'],
        'controller': ['component', 'widget'],
        'template': ['component', 'widget']
    };

    /***
     * 以widget为单位的别名map
     */
    var aliasMap = {};
    var aliasReg = /[^\/]*$/;

    /***
     * @desc 返回一个创造制定类实例的方法
     * @param {Object}  myClass 类对象
     */
    var getInstanceFactory = function(myClass) {
        var cc = function(args) {
            return myClass.apply(this, args);
        }
        cc.prototype = myClass.prototype;
        return function() {
            return new cc(arguments);
        }
    };
    /***
     * @class 模块工厂类
     * 用于加载和生成各种模块
     */
    var ModuleFactroy = {

        /***
         * @desc    定义一个新的类
         * @param   {Object}    prop        模块成员属性
         */
        define: function(prop) {
            if (!prop || !prop.hasOwnProperty('path') || !prop.hasOwnProperty('sub')) return; //必须包含模块名

            var _self = this,
                _path = prop.path,
                _requires = [],
                _tmpRequires = [], //依赖
                _extend = null; //继承

            var _attr = Module.getModuleAttr(_path);
            //检查初始化alias配置
            Module.checkAndInitAlias(prop);
            prop.requires = Module.convertPaths(prop.requires, _attr);
            prop.extend = Module.convertAlias(prop.extend, _attr);

            _extend = prop.extend;
            _tmpRequires = prop.requires, //依赖
                // 检查依赖关系
                ModuleFactroy._checkDeps(_path, prop);


            if (_tmpRequires && $.isArray(_tmpRequires) && _tmpRequires.length > 0) {
                for (var i = 0, len = _tmpRequires.length; i < len; i++) {
                    _requires.push(Module.getJsPath(_tmpRequires[i], _attr));
                }
            }

            if (_extend && _extend != '') {
                //继承模块
                _extend = Module.getJsPath(_extend);
                _requires.push(_extend);
            }
            var _jsPath = Module.getJsPath(_path);
            //声明FIS模块
            F.module(_jsPath, function(require, exports) {
                var _sub = $.extend({}, prop.sub);
                _sub.require = require; //传入加载方法
                _sub.__attr = _attr; //写入模块属性

                if (_extend) { //有继承的情况下
                    var _extendsClass = require(_extend); //返回父类
                    if (_extendsClass && _extendsClass.hasOwnProperty('cls')) { //继承父类
                        exports.cls = _extendsClass.cls.extend(_sub);
                    } else {
                        throw new Error('@ModuleFactroy : Superclass is not defined!');
                    }
                } else { //无继承
                    exports.cls = Module.extend(_sub);
                }
            }, _requires);
        },
        /***
         * @desc 加载一个模块  对F.use进行再次封装，回调函数会直接以这个模块的实例为参数
         * @param {String} path 模块路径
         * @param {Array} params 参数集合
         * @param {Function} fn 回调函数 参数是生成的类实例
         * @param {Boolean} rewrite 是否覆盖window下对widget的引用 只在加载widget的情况下有效 默认是true
         */
        use: function(path, params, fn, rewrite) {
            //var _path = Module.getJsPath(path);
            var _attr = Module.getModuleAttr(path);

            F.use(_attr.path, function(exports) {
                var _instance, _class, _params, cssPath;

                // 为该类注入切面
                AopManager.inject(path, exports.cls);

                _class = (exports.cls && getInstanceFactory(exports.cls)) || null;
                _params = ($.isArray(params)) ? params : [params];
                if (_class){
                    if(_params[0] && _params[0]['loadCss'] === true){ //加载CSS
                        cssPath = Module.getCssPath(path);
                        F.loadCss(cssPath);
                    }
                    _instance = _class.apply(null, _params);
                }else{
                    throw new Error('class is undefined! - ' + _attr.path);
                }

                if (_attr.type == 'widget' && (typeof rewrite == 'undefined' || rewrite !== false)) {
                    window[_attr.scope] = window[_attr.scope] || {};
                    window[_attr.scope][_attr.module] = _instance;
                }
                if (fn && $.isFunction(fn)) {
                    fn.call(null, _instance);
                }
            });
        },
        /***
         * @desc 加载一个模块 并作为一个单例使用，回调函数会直接以这个模块的单例作为参数
         * @param   {String}    path    模块路径
         * @param   {Function}  fn      回调函数，参数是单例
         */
        getInstance: function(path, fn) {
            var _attr = Module.getModuleAttr(path),
                _modulePath = _attr.modulePath;

            var _instance = ModuleFactroy._checkGlobalInstance(path); //检查是否已经有该实例

            if (_instance && typeof _instance == 'object') { //如果已经包含该实例，则返回
                if (fn && $.isFunction(fn)) {
                    fn.call(null, _instance);
                }
            } else {
                ModuleFactroy.use(path, null, function(instance) {
                    if (!instance || typeof instance != 'object') return;
                    ModuleFactroy._addGlobalInstance(path, instance);
                    if (fn && $.isFunction(fn)) {
                        fn.call(null, instance);
                    }
                });
            }
        },
        /***
         * @desc 检查公共域中
         */
        _checkGlobalInstance: function(path) {
            var _attr = Module.getModuleAttr(path),
                _modulePath = _attr.modulePath;

            if (!window['__moduleInstances__']) { //如果没有存储 建立存储
                window['__moduleInstances__'] = {};
            }
            var instance = window['__moduleInstances__'][_modulePath];

            if (instance) {
                return instance;
            } else {
                return null;
            }
        },
        _addGlobalInstance: function(path, instance) {
            var _instance = ModuleFactroy._checkGlobalInstance(path);

            if (_instance) return false; //已经包含该实例

            var _attr = Module.getModuleAttr(path),
                _modulePath = _attr.modulePath;

            window['__moduleInstances__'][_modulePath] = instance;

            return true;
        },
        /***
         * @desc 检查依赖关系是否正常
         */
        _checkDeps: function(path, prop) {
            var _attr = Module.getModuleAttr(path);

            if (_attr.type !== undefined) {
                if ($.isArray(extendsWhiteList[_attr.type])) {
                    //检测模块继承
                    if (prop.extend && prop.extend != '' && $.inArray(Module.getModuleAttr(prop.extend)['type'], extendsWhiteList[_attr.type]) < 0)
                        throw new Error('@ModuleFactroy._checkDeps : Can not extends module! - ' + path);
                }
                if ($.isArray(requireWhiteList[_attr.type])) {
                    //检测模块引用
                    if (prop.hasOwnProperty('requires') && $.isArray(prop.requires)) {
                        for (var i = 0, len = prop.requires.length; i < len; i++) {
                            var _requireAttr = Module.getModuleAttr(prop.requires[i], _attr);
                            if (_requireAttr['module'] != _attr['module'] && $.inArray(_requireAttr['type'], requireWhiteList[_attr.type]) < 0)
                                throw new Error('@ModuleFactroy._checkDeps : can not require module!');
                        }
                    }
                }
            }
        }
    };
    /***
     * @class Module 基类
     * 所有模块类的基类
     */
    var Module = Dispatcher.extend({
        __attr: {}, //模块属性 包含文件名、类型、模块名、scope，框架在模块define的时候生成
        initial: function() {

        },
        /***
         * @desc 返回一个模块类的实例
         * @param {String}  path    模块路径
         * @param {Array}   params  参数集合
         */
        requireInstance: function(path, params) {
            //alert(this.__attr.name);
            path = Module.convertAlias(path, this.__attr);
            this.__checkUse(path);
            if (!this.require || !$.isFunction(this.require))
                throw new Error('@Module : this._require is not defined!');

            var _attr = Module.getModuleAttr(path, this.__attr);
            var _jsPath = _attr.path; //获取文件路径
            var _export = this.require(_jsPath);

            var _func = getInstanceFactory(_export.cls); //实例构造器
            var _params = ($.isArray(params)) ? params : [params];
            var _instance = _func.apply(null, _params); //生成实例 如果是单例，第一次生成接收参数

            return _instance;
        },
        /***
         * @deprecated
         */
        use: function() {

            var path = arguments[0];
            var args = Array.prototype.slice.call(arguments, 1); //获取参数
            return this.requireInstance.apply(this, [path, args]);
        },
        /***
         * @desc 获取一个模块的单例
         * @deprecated
         * @param   {String}    path    模块路径
         * @returns {Object}    模块的单例
         */
        getInstance: function(path) {
            path = Module.convertAlias(path, this.__attr);
            this.__checkUse(path);
            if (!this.require || !$.isFunction(this.require))
                throw new Error('@Module : this._require is not defined!');

            var _attr = Module.getModuleAttr(path, this.__attr);
            var _instance = ModuleFactroy._checkGlobalInstance(path); //检查是否已经有该实例

            if (_instance && typeof _instance == 'object') { //已经实例化
                return _instance;
            } else {
                _instance = this.requireInstance(path); //实例化
                ModuleFactroy._addGlobalInstance(path, _instance); //添加单例存储
                return _instance;
            }
        },
        /***
         * @desc 用于异步加载一个module
         */
        requireInstanceAsync: function(path, args, fn) {
            this.__checkUse(path);
            //var _jsPath = Module.getJsPath(path, this.__attr); //获取文件路径
            //var _argsArr = Array.prototype.slice.call(arguments, 1);
            //_argsArr.unshift(_jsPath);
            ModuleFactroy.use.apply(null, arguments);
        },
        //require: F.require,
        //requireAsync: F.use,
        /***
         * @desc 检查是否可以加载该模块
         * @param   {String}    path    模块路径
         */
        __checkUse: function(path) {
            if (path.indexOf('/') > 0) {
                var _mAttr = Module.getModuleAttr(path);
                //不在可引用范围之内
                if ((_mAttr.scope != this.__attr.scope || _mAttr.type != this.__attr.type || _mAttr.module != this.__attr.module) && $.inArray(_mAttr.type, requireWhiteList[this.__attr.type]) < 0) {
                    throw new Error('@Module : Can not use this Module!');
                }
            }
        }
    });

    /***
     * @desc 检查且初始化别名配置
     * @param {prop} 配置模块
     */
    Module.checkAndInitAlias = function(prop) {
        var path = prop.path;
        var file = path.match(aliasReg)[0];
        var _module;
        var moduleAlias;
        var attrArr;

        if (file !== path && file === '__alias') {
            attrArr = $.trim(path).split('/');
            _module = attrArr[2];
            if (prop.sub.alias) {
                aliasMap[_module] = prop.sub.alias;
            } else {
                throw new Error('@Module : __alias can not be used !');
            }
        }
    }

    /***
     * @desc 别名转换为真正模块4个属性路径模块名
     * @param {paths} 模块路径数组
     * @param {localAttr} localAttr 调用方的属性
     */
    Module.convertPaths = function(paths, localAttr) {
        var _arr = [];
        if (!$.isArray(paths)) {
            return;
        }
        $.each(paths, function(index, path) {
            _arr.push(Module.convertAlias(path, localAttr));
        });
        return _arr;
    }

    /***
     * @desc 别名转换为真正模块4个属性路径模块名
     * @param {path} 模块路径
     * @param {localAttr} localAttr 调用方的属性
     */
    Module.convertAlias = function(path, localAttr) {
        var _module;
        var moduleAlias;
        if (!localAttr || !path) {
            return path;
        }

        _module = localAttr.module;
        moduleAlias = aliasMap[_module] || {};

        if (moduleAlias[path]) {
            path = moduleAlias[path];
        }
        return path;
    }

    /***
     * @desc 从模块名中获取模块属性
     * path 支持三种格式
     * 1. scope/type/module/file    填写全部4个属性的path 直接指定到
     * 2. scope/type/module         填写3个属性path 定位到module 指定到module同名文件
     * 3. file                      只填写单个file 只调用方的目录下的该名文件
     * @param {String} path模块名
     * @param {Object} localAttr 调用方的属性
     */
    Module.getModuleAttr = function(path, localAttr) {
        var _nameArr,
            _type,
            _scope,
            _file,
            _module,
            _path,
            _len,
            _moduleInnerPath = '',
            _modulePath,
            _sep = '/';

        _nameArr = path.replace(/\/$/, '').split('/');
        _len = _nameArr.length;

        if (_len == 1 && localAttr) {
            _file = path;
            _module = localAttr.module;
            _type = localAttr.type;
            _scope = localAttr.scope;
        } else if (_len === 3 || _len === 4) {
            _type = _nameArr[1].toLowerCase();
            _module = _nameArr[2];
            _scope = _nameArr[0];
            _file = (_len > 3) ? _nameArr[3] : _nameArr[2];
        } else if (_len > 4) {
            _type = _nameArr[1].toLowerCase();
            _module = _nameArr[2];
            _scope = _nameArr[0];
            for (var i = 3; i < _len - 1; i++) {
                _moduleInnerPath += _nameArr[i] + _sep;
            }
            _file = _nameArr[_len - 1];
        } else {
            return false;
        }
        _file = Module.nameToFile(_file);

        //驼峰命名类，下划线命名文件
        _path = (_scope + _sep + _type + _sep + Module.nameToFile(_module) + _sep + _moduleInnerPath + _file + '.js?class').toString();
        _modulePath = (_scope + _sep + _type + _sep + _module + _sep + _moduleInnerPath + _file).toString();

        return {
            scope: _scope, //svn模块
            module: _module, //所属module
            file: _file, //文件名
            type: _type, //所属module类型
            path: _path, //文件真实路径
            modulePath: _modulePath //模块路径
        };
    }
    Module.nameToFile = function(name) {
        return name.replace(/([a-z])([A-Z])/g, function() {
            return arguments[1] + '_' + arguments[2];
        }).toLowerCase();
    }
    /***
     * @desc 将module名跟路径进行转换
     * @param {String} path 模块路径
     * @param {String} localAttr 调用方的属性
     */
    Module.getJsPath = function(path, localAttr) {
        //如果是路径，直接返回路径
        var _attr = Module.getModuleAttr(path, localAttr);
        return _attr.path;
    }

    /***
     * @desc  将CSS的路径做替换成文件路径
     * @param {String} path 模块路径
     */
    Module.getCssPath = function (path) {
        return '/tb/static-' + path.replace(/^(\w+\/\w+\/)(\w+).*/g, function(){
            if(arguments[1] && arguments[2]){
                var cssFileName = Module.nameToFile(arguments[2]);
                return arguments[1] + cssFileName + '/' + cssFileName + '.css';
            }
            return arguments[0];
        })
    }

    /***
     * 暴露接口
     */

    return {
        Module: {
            use: ModuleFactroy.use, //实例化模块
            define: ModuleFactroy.define, //声明模块
            getInstance: ModuleFactroy.getInstance //单例模块
        },
        Class: Class,
        Dispatcher: Dispatcher,
        MessageManager: MessageManager,
        AopManager: AopManager
    }

})());