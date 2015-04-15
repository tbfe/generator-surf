'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var yaml = require('js-yaml');
var titleCase = require('title-case');
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
        var author = this.author;
        var tmp = [];
        var str = widgetName;
        var moduleStr = this.moduleStr;
        var moduleName = this.moduleName;
        var date = new Date().toISOString().substring(0, 10);
        var widgetTypes = this.widgetTypes;
        var moduleConfig = yaml.load(moduleStr);
        moduleName = moduleConfig.name;
        this.moduleName = moduleName;
        this.log(moduleName);
        /*if(moduleName){
           moduleStr = moduleName.charAt(0).toUpperCase()+moduleName.substr(1);
        }
        if(widgetName.indexOf('_')){
          str = '';
          tmp = widgetName.split('_');
          tmp.forEach(function(value,index){
            str += value.charAt(0).toUpperCase() + value.substr(1);
          });
        }*/
        // title case 的作用 frs_test => Frs Test,

        var capWidgetName = widgetName && titleCase(widgetName) && titleCase(widgetName).replace(/\W/g, '_');

        var capitalizedModuleName = moduleName && titleCase(moduleName) && titleCase(moduleName).replace(/\W/g, '_');

        var fileConf =  {
            author:author,
            widgetName:widgetName,
            moduleName:moduleName,
            capWidgetName:capWidgetName,
            capitalizedModuleName: capitalizedModuleName,
            date:date
        };
        widgetTypes.forEach(function(value,index){
          this.fs.copyTpl(
            this.templatePath('widget_tpl'+value.substr(6)),
            this.destinationPath('src/widget/'+widgetName+'/'+widgetName+value.substr(6)),
            fileConf
          );
        }.bind(this));

    }
  },

  end:function  () {
    // say goodbye
    this.log('say goodbye');
  },

  install: function () {
  }
});
