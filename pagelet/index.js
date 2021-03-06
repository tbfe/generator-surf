'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var yaml = require('js-yaml');
var titleCase = require('title-case');

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
      this.fileTypes = [];//选择要生成的类型
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
          default: '',
          store:true
        },
        {
            type: 'checkbox',
            name: 'fileTypes',
            choices: ['pagelet.php', 'pagelet.class.php','pagelet.yml','pagelet.less','pagelet.js'],
            message: 'j/k + enter选择您需要的文件类型，多选',
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
        this.pageletName = props.pageletName;
        this.author = props.author;
        this.fileTypes = props.fileTypes;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
        var pageletName = this.pageletName;
       // var renderPageletName = pageletName;
        var moduleStr = this.moduleStr;
        var moduleConfig = yaml.load(moduleStr);
        var moduleName = moduleConfig.name;
        var fileConf = {};
        //renderPageletName = this._.camelize(pageletName).charAt(0).toUpperCase()+this._.camelize(pageletName).substr(1);
        // if(pageletName.indexOf('_') > -1){
        //   // pageletName = '';
        //   // tmp = pageletName.split('_');
        //   // tmp.forEach(function(value,index){
        //   //   pageletName += this._.camelize(value);
        //   // }.bind(this));
        //    renderPageletName = this._.camelize(pageletName).charAt(0).toUpperCase()+this._.camelize(pageletName).substr(1);
        // }
        var author = this.author;
        var capitalizedModuleName = moduleName && titleCase(moduleName) && titleCase(moduleName).replace(/\W/g,'_');
        var capitalizePageletName = pageletName && titleCase(pageletName) && titleCase(pageletName).replace(/\W/g,'_');
        fileConf =  {
            author:author,
            moduleName:moduleName,
            pageletName:pageletName,
            capitalizedModuleName: capitalizedModuleName,
            capitalizePageletName:capitalizePageletName,
            date:new Date().toISOString().substring(0, 10)
        };
        // frs camelize('frs')=>frs why?
        // this.fs.copyTpl(
        //   this.templatePath('pagelet.php'),
        //   this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.php'),
        //   fileConf
        // );

        // this.fs.copyTpl(
        //   this.templatePath('pagelet.class.php'),
        //   this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.class.php'),
        //   fileConf
        // );

        // this.fs.copyTpl(
        //   this.templatePath('pagelet.less'),
        //   this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.less'),
        //   fileConf
        // );

        // this.fs.copyTpl(
        //   this.templatePath('pagelet.js'),
        //   this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.js'),
        //   fileConf
        // );
        var fileTypes = this.fileTypes;
        fileTypes.forEach(function(value,index){
          this.fs.copyTpl(
            this.templatePath('pagelet'+value.substring(7)),
            this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+value.substring(7)),
            fileConf
          );
        }.bind(this));
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
  }
});
