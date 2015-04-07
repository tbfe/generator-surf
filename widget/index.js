'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
      this.viewFiles = this.viewFiles || [];
      this.widgetName = '';
      this.author = '';
      //var aa = this.expand(this.destinationPath('./*'));//执行当前命令的所有
  },

  prompting: function () {
      var done = this.async();
      this.log(yosay(chalk.red('now to generate view page')));
      var prompts = [
        {
          type: 'input',
          name: 'widgetName',
          message: 'widgetName:',
          default: 'test'
        }
      ];
      this.prompt(prompts, function (props) {
        this.widgetName = props.widgetName;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
        var widgetName = this.widgetName;
        var tmp = [];
        var str = widgetName;
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
          {author:'====================',widgetName:str}
        );
        this.fs.copyTpl(
          this.templatePath('widget_tpl.php'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.php'),
          {widgetName:widgetName}
        );

        this.fs.copy(
          this.templatePath('widget_tpl.js'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.js')
        );

        this.fs.copy(
          this.templatePath('widget_tpl.css'),
          this.destinationPath('src/widget/'+widgetName+'/'+widgetName+'.css')
        );

        this.mkdir('src/widget/'+widgetName+'/'+widgetName+'/image');
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
