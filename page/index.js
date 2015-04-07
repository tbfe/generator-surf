'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
      this.viewFiles = this.viewFiles || [];
      this.pageName = '';
  },

  prompting: function () {
      var done = this.async();
      this.log(yosay(chalk.red('now to generate view page')));
      var prompts = [
        {
          type: 'input',
          name: 'pageName',
          message: 'pageName:',
          default: 'test'
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
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
      var tplConf = ['page.css','page.js','page.php'];
      var pageName = this.pageName;
      tplConf.forEach(function  (value,index) {
         this.fs.copy(
          this.templatePath(value),
          this.destinationPath('src/page/'+pageName+'/'+pageName+value.substr(4))
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
      skipInstall: false
    });
  }
});
