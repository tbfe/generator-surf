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
          default: '',
          store:true
        },
        {
            type: 'checkbox',
            name: 'widgetTypes',
            choices: ['widget.php', 'widget.class.php','widget.less','widget.js'],
            message: 'j/k + 空格键 选择您需要的文件类型，多选',
            default:0,
            validate: function(answers) {
                if(answers.length>0){
                  return true;
                }else{
                  return '必须选择一个';
                }
            }
        }
      ];
      this.prompt(prompts, function (props) {
        this.widgetName = props.widgetName;
        this.author = props.author;
        this.widgetTypes = props.widgetTypes;
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
        var widgetTypes = this.widgetTypes;
        if(name && name[3]){
          //匹配的第三个就是模块名
          moduleName = name[3]
        }else{
          // 没取到争取的moduleName
          moduleName = '';
        }
        this.moduleName = moduleName;

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

        var fileConf =  {author:author,capWidgetName:str,widgetName:widgetName,moduleStr:moduleStr,date:date};
        widgetTypes.forEach(function(value,index){
          this.fs.copyTpl(
            this.templatePath('widget_tpl'+value.substr(6)),
            this.destinationPath('src/widget/'+widgetName+'/'+widgetName+value.substr(6)),
            fileConf
          );
        }.bind(this));

      //  this.mkdir('src/widget/'+widgetName+'/image');
      //widget默认不用生成生成image ，asked by yongzheng
    }
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
