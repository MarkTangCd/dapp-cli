'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const Command = require('@dapp-cli/command');
const log = require('@dapp-cli/log');
const templates = require('./templates');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }

  async exec() {
    try {
      const projectInfo = await this.prepare();
      if (projectInfo) {
        // 2. Download template
        log.verbose('projectInfo', projectInfo);
        this.projectInfo = projectInfo;
        this.downloadTemplate();
        // 3. Install template
      }
    } catch(e) {
      log.error(e.message);
    }
  }

  downloadTemplate() {
    console.log(this.projectInfo, templates);
  }

  async prepare() {
    const localPath = process.cwd();
    if(!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: 'The current folder is not empty, does the project continue to be created?'
        })).ifContinue;

        if (!ifContinue) {
          return;
        }
      }

      if (ifContinue || this.force) {
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: 'Confirm to empty the current folder?'
        });
        if (confirmDelete) {
          fse.emptyDirSync(localPath);
        }
      }
    }
    return this.getProjectInfo();
  }

  async getProjectInfo() {
    let projectInfo = {};
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'Please select the initialization type',
      default: TYPE_PROJECT,
      choices: [{
        name: 'Project',
        value: TYPE_PROJECT
      }, {
        name: 'Component',
        value: TYPE_COMPONENT
      }]
    });
    log.verbose('type', type);

    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt([{
        type: 'input',
        name: 'projectName',
        message: 'Please enter the project name',
        default: '',
        validate: function(v) {
          const done = this.async();
          setTimeout(function () {
            if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done('Please enter the project name in the correct format');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function(v) {
          return v;
        }
      }, {
        type: 'input',
        name: 'projectVersion',
        message: 'Please enter the project version number',
        default: '1.0.0',
        validate: function(v) {
          const done = this.async();
          setTimeout(function () {
            if (!(!!semver.valid(v))) {
              done('Please enter the project version number in the correct format');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function(v) {
          if (!!semver.valid(v)) {
            return semver.valid(v);
          } else {
            return v;
          }
        }
      }]);
      projectInfo = {
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {

    }

    return projectInfo;
  }

  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(file => (
      !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    ));
    return !fileList || fileList.length <= 0;
  }

}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
