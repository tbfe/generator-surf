'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
      this.viewFiles = this.viewFiles || [];
      this.pageletName = '';
  },

  prompting: function () {
      var done = this.async();
      this.log(yosay(chalk.red('now to generate view page')));
      var prompts = [
        {
          type: 'input',
          name: 'pageletName',
          message: 'pageletName:',
          default: 'test'
        }
      ];
      this.prompt(prompts, function (props) {
        this.pageletName = props.pageletName;
        done();
      }.bind(this));
  },

  writing: {
    app: function () {
        var pageletName = this.pageletName;
        this.fs.copy(
          this.templatePath('pagelet.php'),
          this.destinationPath('/src/pagelet/'+pageletName+'/'+pageletName+'.php')
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
      skipInstall: false
    });
  }
});
