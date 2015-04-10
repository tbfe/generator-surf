'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
      this.existedPageFiles =  [];
      this.pageName = '';
      var pageFiles = this.expand(this.destinationPath('./src/page/*/'));
      var reg = /\/(\w+)(\/$)/ ;//匹配当期文件夹名
      pageFiles.forEach(function(v) {
       if(v && v.lastIndexOf('/') > -1){
          this.existedPageFiles.push(reg.exec(v)[1]);
       }
      }.bind(this));
      this.fileTypes = [];
  },

  prompting: function () {
      var done = this.async();
      this.log(yosay(chalk.red('now to generate  page')));
      var prompts = [
        {
          type: 'input',
          name: 'pageName',
          message: 'pageName:',
          default: 'test',
          validate: function(input) {
                if (this.existedPageFiles && this.existedPageFiles.indexOf(this._.underscored(input)) > -1) {
                    return '这个page已存在==>  '+input + ' 已存在！';
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
            choices: ['page.php','page.less','page.js'],
            message: 'j/k +空格键  选择您需要的文件类型，多选',
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
        this.pageName = props.pageName;
        this.author = props.author;
        this.fileTypes = props.fileTypes;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
      var tplConf = ['page.less','page.js','page.php'];
      var pageName = this.pageName;
      var author = this.author;
      var date = new Date().toISOString().substring(0, 10);
      var fileConf = {author:author,date:date,pageName:pageName};
      var fileTypes = this.fileTypes;
      fileTypes.forEach(function(value,index){
         this.fs.copyTpl(
          this.templatePath(value),
          this.destinationPath('src/page/'+pageName+'/'+pageName+value.substr(4)),
          fileConf
        );
      }.bind(this));
     
      this.mkdir('src/page/'+pageName +'/image');
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
