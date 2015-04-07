'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
//var astQuery = require('ast-query');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
      this.existedWidgetFiles = [];
      this.widgetName = '';
      this.moduleName = '';
      this.author = '';
      //var aa = this.expand(this.destinationPath('./*'));//执行当前命令的所有
      var moduleStr  = '';
      try{
         this.moduleStr = this.readFileAsString('module.yml');
      }catch(e){
         this.log('读取生成模块配置出错，module.yml没找到，你可能执行的命令的路径不对');
      }
      var widgetFiles = this.expand(this.destinationPath('./src/widget/*/'));
      var reg = /\/(\w+)(\/$)/ ;//匹配当期文件夹名
      this.log(widgetFiles);
      widgetFiles.forEach(function(v) {
       if(v && v.lastIndexOf('/') > -1){
          this.existedWidgetFiles.push(reg.exec(v)[1]);
       }
      }.bind(this));
      
  },

  prompting: function () {
      var done = this.async();
      this.log(yosay(chalk.red('now to generate widget ')));
      var prompts = [
        {
          type: 'input',
          name: 'widgetName',
          message: 'widgetName:',
          default: 'my_test',
          validate: function(input) {
                if (this.existedWidgetFiles && this.existedWidgetFiles.indexOf(this._.underscored(input)) > -1) {
                    return '这个widget  ==> '+input + ' 已存在！';
                } else {
                    return true;
                }
            }.bind(this)
        },
        {
          type: 'input',
          name: 'author',
          message: 'author:',
          default: ''
        }
      ];
      this.prompt(prompts, function (props) {
        this.widgetName = props.widgetName;
        this.author = props.author;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
        var widgetName = this.widgetName;
        var nameReg = /\s*(name:)(\s+)(\w+)(\r\n)+/;//匹配module.yml中的name
        var author = this.author;
        var tmp = [];
        var str = widgetName;
        var repModStr = '';
        var moduleStr = this.moduleStr;
        var moduleName = this.moduleName;
        var name = nameReg.exec(moduleStr);
        var date = new Date().toISOString().substring(0, 10);
        if(name && name[3]){
          //匹配的第三个就是模块名
          moduleName = name[3]
        }else{
          // 没取到争取的moduleName
          moduleName = '';
        }
        this.moduleName = moduleName;

        //read som config from module.yml
        // var deployConfFile = this.expand(this.destinationPath('module.yml'));
        // var modName = '';
        // console.log("读取路径",deployConfFile);
        // if (deployConfFile.length > 0) {
        //   //var deployConfTree = astQuery(this.readFileAsString(this.destinationPath('module.yml')));
        //   var str = this.readFileAsString(deployConfFile);
        //   console.log('=====================');
        //   console.log(str);
        //   //  var deployConfBody = deployConfTree.assignment('module.exports').nodes[0].right.properties;
        //   //modName = deployConfBody[1].value.value;
        // }


        if(moduleName){
           moduleStr = moduleName.charAt(0).toUpperCase()+moduleName.substr(1);
        }
        if(widgetName.indexOf('_')){
          str = '';
          tmp = widgetName.split('_');
          tmp.forEach(function(value,index){
            str += value.charAt(0).toUpperCase() + value.substr(1);
          });
        }
        this.fs.copyTpl(
          this.templatePath('widget_tpl.class.php'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.class.php'),
          {author:author,widgetName:str,moduleStr:moduleStr,date:date}
        );
        this.fs.copyTpl(
          this.templatePath('widget_tpl.php'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.php'),
          {author:author,widgetName:widgetName,date:date}
        );

        this.fs.copyTpl(
          this.templatePath('widget_tpl.js'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.js'),
          {author:author,widgetName:widgetName,date:date}
        );

        this.fs.copyTpl(
          this.templatePath('widget_tpl.css'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.css'),
           {author:author,widgetName:widgetName,date:date}
        );

        this.mkdir('src/widget/'+widgetName+'/image');
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
