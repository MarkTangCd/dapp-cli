'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const userHome = require('user-home');
const Command = require('@dapp-cli/command');
const Package = require('@dapp-cli/package');
const log = require('@dapp-cli/log');
const { spinnerStart, sleep, execAsync } = require('@dapp-cli/utils');
const templates = require('./templates');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const WHITE_COMMAND = ['npm', 'cnpm', 'yarn', 'pnpm'];

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
        await this.downloadTemplate();
        // 3. Install template
        await this.installTemplate();
      }
    } catch(e) {
      log.error(e.message);
    }
  }

  async installTemplate() {
    if (this.templateInfo) {
      await this.installNormalTemplate();
    } else {
      throw new Error('The project template information does not exist!');
    }
  }

  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }

    return null;
  }

  async execCommand(command, errMsg = 'Dependency package installation failed!') {
    let ret;
    if (command && command.length > 0) {
      const cmd = this.checkCommand(command[0]);
      if (!cmd) {
        throw new Error('The command does not exist: ', command);
      }
      const args = command.slice(1);
      ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
    if (ret !== 0) {
      throw new Error(errMsg);
    }
    return ret;
  }

  async installNormalTemplate() {
    log.verbose('templateNpm', this.templateNpm);
    let spinner = spinnerStart('Template being installed');
    await sleep();
    try {
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
      const targetPath = process.cwd();
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      fse.copySync(templatePath, targetPath);
    } catch(e) {
      throw e;
    } finally {
      spinner.stop(true);
      log.success('Template installed successfully.');
    }

    const { installCommand, startCommand } = this.templateInfo;
    // install
    await this.execCommand(installCommand);
    // start
    await this.execCommand(installCommand);
  }

  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.templates.find(item => item.npmName === projectTemplate);
    const targetPath = path.resolve(userHome, '.dapp-cli-dev', 'template');
    const storeDir = path.resolve(userHome, '.dapp-cli-dev', 'template', 'node_modules');
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version
    });
    if (! await templateNpm.exists()) {
      const spinner = spinnerStart('Downloading the template...');
      await sleep();
      try {
        await templateNpm.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (templateNpm.exists()) {
          log.success('Download template successfully');
          this.templateNpm = templateNpm;
        }
      }
    } else {
      const spinner = spinnerStart('Updating the template...');
      await sleep();
      try {
        await templateNpm.update();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (templateNpm.exists()) {
          log.success('Update template successfully');
          this.templateNpm = templateNpm;
        }
      }
    }
  }

  async prepare() {
    this.templates = templates;
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

  createTemplateChoice() {
    return templates.map(item => ({
      value: item.npmName,
      name: item.name
    }));
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
      }, {
        type: 'list',
        name: 'projectTemplate',
        message: 'Please select a project template',
        choices: this.createTemplateChoice()
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
