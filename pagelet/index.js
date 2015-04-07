'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
      this.pageletFiles = [];
      this.pageletName = '';
      this.moduleStr  = '';
      var pageletFiles = this.expand(this.destinationPath('./src/pagelet/*/'));
      var reg = /\/(\w+)(\/$)/ ;//匹配当期文件夹名
      pageletFiles.forEach(function(v) {
       if(v && v.lastIndexOf('/') > -1){
          this.pageletFiles.push(reg.exec(v)[1]);
       }
      }.bind(this));
      try{
         this.moduleStr = this.readFileAsString('module.yml');
      }catch(e){
         this.log('读取生成模块配置出错，module.yml没找到，你可能执行的命令的路径不对');
      }
  },

  prompting: function () {
      var done = this.async();
      this.log(yosay(chalk.red('now to generate pagelet')));
      var prompts = [
        {
          type: 'input',
          name: 'pageletName',
          message: 'pageletName:',
          default: 'test',
          validate: function(input) {
                if (this.pageletFiles && this.pageletFiles.indexOf(this._.underscored(input)) > -1) {
                    return '这个pagelet已存在==>  '+input + ' 已存在！';
                } else {
                    return true;
                }
            }.bind(this)
        },
        {
          type: 'input',
          name: 'author',
          message: 'author:',
          default: 'shibiao',
        }
      ];
      this.prompt(prompts, function (props) {
        this.pageletName = props.pageletName;
        this.author = props.author;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
        var nameReg = /\s*(name:)(\s+)(\w+)(\r\n)+/;//匹配module.yml中的name
        var pageletName = this.pageletName;
        var renderPageletName = pageletName;
        var tmp = [];
        var moduleStr = this.moduleStr;
        var moduleName = '';
        var name = nameReg.exec(moduleStr);
        var fileConf = {};
        if(name && name[3]){
          //匹配的第三个就是模块名
         // moduleName = this._.camelize(name[3]);
            moduleName = name[3].charAt(0).toUpperCase() + name[3].substr(1);
        }else{
          // 没取到争取的moduleName
          moduleName = '';
        }
         renderPageletName = this._.camelize(pageletName).charAt(0).toUpperCase()+this._.camelize(pageletName).substr(1);
        // if(pageletName.indexOf('_') > -1){
        //   // pageletName = '';
        //   // tmp = pageletName.split('_');
        //   // tmp.forEach(function(value,index){
        //   //   pageletName += this._.camelize(value);
        //   // }.bind(this));
        //    renderPageletName = this._.camelize(pageletName).charAt(0).toUpperCase()+this._.camelize(pageletName).substr(1);
        // }
        var author = this.author;
        fileConf =  {
            author:author,
            moduleName:moduleName,
            pageletName:renderPageletName,
            tplPageletName:pageletName,//。php中class=""中pageletname名字首字母不大写
            date:new Date().toISOString().substring(0, 10)
        };
        // frs camelize('frs')=>frs why?
        this.fs.copyTpl(
          this.templatePath('pagelet.php'),
          this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.php'),
          fileConf
        );

        this.fs.copyTpl(
          this.templatePath('pagelet.class.php'),
          this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.class.php'),
          fileConf
        );

        this.fs.copyTpl(
          this.templatePath('pagelet.css'),
          this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.css'),
          fileConf
        );

        this.fs.copyTpl(
          this.templatePath('pagelet.js'),
          this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.js'),
          fileConf
        );
    }

    // projectfiles: function () {
    //   this.fs.copy(
    //     this.templatePath('editorconfig'),
    //     this.destinationPath('.editorconfig')
    //   );
    //   this.fs.copy(
    //     this.templatePath('jshintrc'),
    //     this.destinationPath('.jshintrc')
    //   );
    // }
  },

  end:function  () {
    // say goodbye
    this.log('say goodbye');
  },

  install: function () {
    this.installDependencies({
      skipInstall: true
    });
  }
});
