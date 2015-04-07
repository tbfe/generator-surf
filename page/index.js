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
          default: ''
        }
      ];
       // var aa = this.expand(this.templatePath('*.ejs'));
       // // this.log("=====================");
       // // this.log(aa.join('=\r\r'));
       // // this.log("=====================");
       // this.argument('app_name', {
       //      required: false,
       //      type: String,
       //      desc: 'view name'
       //  });
       // console.log(this.app_name+"===========");
       /**
        * option 与 argument 功能有重复
        * yo like:views aaaa --mocamoca
        *这个时候得到的option是默认值，为啥？
        *
        */
       // this.option('coffee',{
       //      type: String,
       //      desc: 'view name',
       //      defaults:'===='
       // });
       // console.log("--------------"+this.options.coffee);
       // console.log(this.options);
      this.prompt(prompts, function (props) {
        this.pageName = props.pageName;
        this.author = props.author;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
      var tplConf = ['page.css','page.js','page.php'];
      var pageName = this.pageName;
      var author = this.author;
      var date = new Date().toISOString().substring(0, 10);
      var fileConf = {author:author,date:date};
      tplConf.forEach(function  (value,index) {
         this.fs.copyTpl(
          this.templatePath(value),
          this.destinationPath('src/page/'+pageName+'/'+pageName+value.substr(4)),
          fileConf
        );
      }.bind(this));
      this.mkdir('src/page/'+pageName +'/image');
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
