'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
    this.projectName = 'test';
     this.existedProjects = [];
     var controlFiles = this.expand(this.destinationPath('./*/'));
     var reg = /\/(\w+)(\/$)/ ;//匹配当期文件夹名
     this.log(controlFiles);
     controlFiles.forEach(function(v) {
     if(v && v.lastIndexOf('/') > -1){
        this.existedProjects.push(reg.exec(v)[1]);
     }
    }.bind(this));
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the solid ' + chalk.red('Surf') + ' generator!'
    ));

    var prompts = [
        {
          type: 'input',
          name: 'projectName',
          message: 'project Name :',
          default: 'test',
          validate: function(input) {
                if (this.existedProjects && this.existedProjects.indexOf(this._.underscored(input)) > -1) {
                    return input + ' 已存在！';
                } else {
                    return true;
                }
            }.bind(this)
        }
    ];

    this.prompt(prompts, function (props) {
      this.projectName = props.projectName;
      done();
    }.bind(this));
  },

  writing: {
    app: function () {
      // for bigpipe moduel code
      var projectName = this.projectName;
      var moduleConf = projectName + '/src/conf/';
      var pagePath = projectName + '/src/page/';
      var pageletPath = projectName + '/src/pagelet/';
      var widgetPath = projectName + '/src/widget/';
      var staticPath = projectName + '/src/static/';
      var commonConfig = '';
      this.fs.copy(
        this.templatePath('_package.json'),
        this.destinationPath( projectName + '/package.json')
      );
      this.fs.copy(
        this.templatePath('_bower.json'),
        this.destinationPath(projectName + '/bower.json')
      );

      //__module_conf.php 
      this.mkdir(moduleConf);
      // this.fs.copy(
      //   this.templatePath('src/module_conf/__module_conf.php'),
      //   this.destinationPath(moduleConf + '__module_conf.php')
      // );

      //build.sh 
      this.fs.copy(
        this.templatePath('build.sh'),
        this.destinationPath(projectName + '/build.sh')
      );

      //dev.sh
      this.fs.copy(
        this.templatePath('dev.sh'),
        this.destinationPath(projectName + '/dev.sh')
      );

      //deploy.yml
      this.fs.copy(
        this.templatePath('deploy.yml'),
        this.destinationPath(projectName+'/deploy.yml')
      );

      //module.yml
      if(projectName == 'common'){
        commonConfig = "jshintConfig:\r\nignored:\r\n- static/lib/**.js";
      }
      this.fs.copyTpl(
        this.templatePath('module.yml'),
        this.destinationPath(projectName + '/module.yml'),
        {
          projectName:projectName,
          commonConfig:commonConfig
        }
      );

      //page 
      this.mkdir(pagePath);
      // this.fs.copyTpl(
      //    this.templatePath('src/page/page/page.css'),
      //    this.destinationPath(pagePath + 'page/page.css')
      // );
      // this.fs.copyTpl(
      //    this.templatePath('src/page/page/page.js'),
      //    this.destinationPath(pagePath + 'page/page.js')
      // );
      // this.fs.copyTpl(
      //    this.templatePath('src/page/page/page.php'),
      //    this.destinationPath(pagePath + 'page/page.php')
      // );

      //pagelet ----projectName + '/pagelet/';
      this.mkdir(pageletPath);
      // this.fs.copyTpl(
      //    this.templatePath('src/pagelet/footer/footer.php'),
      //    this.destinationPath(pageletPath + 'footer/footer.php')
      // );

      //widget --projectName + '/widget/';
      this.mkdir(widgetPath);
      //footer
      // this.fs.copy(
      //   this.templatePath('src/widget/footer/footer.class.php'),
      //   this.destinationPath(widgetPath + 'footer/footer.class.php')
      // );
      // this.fs.copy(
      //   this.templatePath('src/widget/footer/footer.css'),
      //   this.destinationPath(widgetPath + 'footer/footer.css')
      // );
      // this.fs.copy(
      //   this.templatePath('src/widget/footer/footer.js'),
      //   this.destinationPath(widgetPath + 'footer/footer.js')
      // );
      // this.fs.copy(
      //   this.templatePath('src/widget/footer/footer.php'),
      //   this.destinationPath(widgetPath + 'footer/footer.php')
      // );
      // //header 
      // this.fs.copy(
      //   this.templatePath('src/widget/header/header.php'),
      //   this.destinationPath(widgetPath + 'header/header.php')
      // );
      // // userbar 
      // this.fs.copy(
      //   this.templatePath('src/widget/userbar/userbar.php'),
      //   this.destinationPath(widgetPath + 'userbar/userbar.php')
      // );
      // this.fs.copy(
      //   this.templatePath('src/widget/userbar/userbar.js'),
      //   this.destinationPath(widgetPath + 'userbar/userbar.js')
      // );
      // this.fs.copy(
      //   this.templatePath('src/widget/userbar/userbar.css'),
      //   this.destinationPath(widgetPath + 'userbar/userbar.css')
      // );
      //static --projectName + 'static/';
      this.mkdir(staticPath+'/js');
      this.mkdir(staticPath+'/lib');
    },

    projectfiles: function () {
      // for bigpipe moduel code
      var projectName = this.projectName;

      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath(projectName + '/.editorconfig')
      );
      this.fs.copy(
        this.templatePath('jshintrc'),
        this.destinationPath(projectName + '/.jshintrc')
      );
    }
  },

  install: function () {
    this.installDependencies({
     // skipInstall: this.options['skip-install']
      skipInstall: false
    });
  }
});
