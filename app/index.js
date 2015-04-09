'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
    this.projectName = 'test';
    this.moduleStr = '';
    try{
         this.moduleStr = this.readFileAsString('module.yml');
    }catch(e){
         this.log('读取生成模块配置出错，module.yml没找到，你可能执行的命令的路径不对');
         this.moduleStr = '';
    }
    var nameReg = /\s*(name:)(\s+)(\w+)(\r\n)+/;//匹配module.yml中的name
    var moduleStr = this.moduleStr;
    var name = nameReg.exec(moduleStr);
    if(name && name[3]){
          //匹配的第三个就是模块名
          this.moduleStr = name[3];
    }
    //其实下面的检测没有多大用处了，因为修改了执行的方式，@liye
    // mkdir aa ,cd aa ,yo surf 这样就不会有模块覆盖的方式问题
    //这里在上面增加检测覆盖情况，module中配置和输入的项目名一样认为会覆盖，不通过执行，不一样则通过
    this.existedProjects = [];
     var controlFiles = this.expand(this.destinationPath('*/'));
     var reg = /\/(\w+)(\/$)/ ;//匹配当期文件夹名
     this.log(controlFiles);
     var tmp = [];
     controlFiles.forEach(function(v) {
     if(v && v.lastIndexOf('/') > -1){
        tmp = reg.exec(v);
        this.existedProjects.push(tmp && tmp[1]);
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
                }else if(this.moduleStr == input){
                    return input + '已经存在module.yml,不应该在新建模块了，如果非要新建，可以删除module.yml在执行';
                }else {
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
      var moduleConf =   'src/conf/';
      var pagePath =   'src/page/';
      var pageletPath =   'src/pagelet/';
      var widgetPath =   'src/widget/';
      var staticPath =   'src/static/';
      var commonConfig = '';
      this.fs.copy(
        this.templatePath('_package.json'),
        this.destinationPath('/package.json')
      );
      this.fs.copy(
        this.templatePath('_bower.json'),
        this.destinationPath('/bower.json')
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
        this.destinationPath('build.sh')
      );

      //dev.sh
      this.fs.copy(
        this.templatePath('dev.sh'),
        this.destinationPath('dev.sh')
      );

      //svn .svnignore
      this.fs.copy(
        this.templatePath('.svnignore'),
        this.destinationPath('.svnignore')
      );

      //deploy.yml
      this.fs.copy(
        this.templatePath('deploy.yml'),
        this.destinationPath('deploy.yml')
      );

      //module.yml
      if(projectName == 'common'){
        commonConfig = "jshintConfig:\r\nignored:\r\n- static/lib/**.js";
      }
      this.fs.copyTpl(
        this.templatePath('module.yml'),
        this.destinationPath('module.yml'),
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
        this.destinationPath('.editorconfig')
      );
      this.fs.copy(
        this.templatePath('.bowerrc'),
        this.destinationPath('.bowerrc')
      );
      // this.fs.copy(
      //   this.templatePath('jshintrc'),
      //   this.destinationPath('/.jshintrc')
      // );
    }
  },

  install: function () {
    this.installDependencies({
     // skipInstall: this.options['skip-install']
      skipInstall: true
    });
  }
});
