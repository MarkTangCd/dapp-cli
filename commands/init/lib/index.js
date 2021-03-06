'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const glob = require('glob');
const ejs = require('ejs');
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
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e);
      }
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

  async ejsRender(options) {
    const dir = process.cwd();
    return new Promise((resolve, reject) => {
      glob('**', {
        cwd: dir,
        ignore: options.ignore || '',
        nodir: true
      }, (err, files) => {
        if (err) {
          reject(err);
        }
        Promise.all(files.map(file => {
          const filePath = path.join(dir, file);
          return new Promise((resolve2, reject2) => {
            ejs.renderFile(filePath, this.projectInfo, {}, (err, result) => {
              if (err) {
                reject2(err);
              } else {
                fse.writeFileSync(filePath, result);
                resolve2(result);
              }
            });
          });
        })).then(() => {
          resolve();
        }).catch(err => {
          reject(err);
        });
      });
    });
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
    const templateIgnore = this.templateInfo.ignore || [];
    const ignore = ['node_modules/**', ...templateIgnore];
    await this.ejsRender({ ignore });
    const { installCommand, startCommand } = this.templateInfo;
    // install
    await this.execCommand(installCommand);
    // start
    if (startCommand && startCommand.length > 0) {
      await this.execCommand(startCommand);
    }
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
    function isValidName(name) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(name);
    }

    let projectInfo = {};
    let isProjectNameValid = false;
    if (isValidName(this.projectName)) {
      isProjectNameValid = true;
      projectInfo.projectName = this.projectName;
    }
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'Please select the initialization type',
      default: TYPE_PROJECT,
      choices: [{
        name: 'Project',
        value: TYPE_PROJECT
      },
      {
        name: 'Component',
        value: TYPE_COMPONENT
      }]
    });
    log.verbose('type', type);
    this.templates = this.templates.filter(template => template.tag.includes(type));
    const title = type === TYPE_PROJECT ? 'project' : 'component';

    const projectNamePrompt = {
      type: 'input',
      name: 'projectName',
      message: `Please enter the ${title} name`,
      validate: function(v) {
        const done = this.async();
        setTimeout(function () {
          if (!isValidName(v)) {
            done(`Please enter the ${title} name in the correct format`);
            return;
          }
          done(null, true);
        }, 0);
      },
      filter: function(v) {
        return v;
      }
    };
    const projectPrompt = [];
    if (!isProjectNameValid) {
      projectPrompt.push(projectNamePrompt);
    }
    projectPrompt.push({
      type: 'input',
      name: 'projectVersion',
      message: `Please enter the ${title} version number`,
      default: '1.0.0',
      validate: function(v) {
        const done = this.async();
        setTimeout(function () {
          if (!(!!semver.valid(v))) {
            done(`Please enter the ${title} version number in the correct format`);
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
      message: `Please select a ${title} template`,
      choices: this.createTemplateChoice()
    });
    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {
      const descriptionPrompt = {
        type: 'input',
        name: 'componentDescription',
        message: 'Please enter the component description',
        validate: function(v) {
          const done = this.async();
          setTimeout(function () {
            if (!v) {
              done('Please enter the component description');
              return;
            }
            done(null, true);
          }, 0);
        }
      };
      projectPrompt.push(descriptionPrompt);
      const project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...project
      }
    }

    // formattedName
    if (projectInfo.projectName) {
      projectInfo.formattedName = require('kebab-case')(projectInfo.projectName).replace(/^-/, '');
    }
    if (projectPrompt.componentDescription) {
      projectInfo.description = projectInfo.componentDescription;
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
