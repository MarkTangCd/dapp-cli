'use strict';

module.exports = core;

const path = require('path');
const semver = require('semver');
const colors = require('colors');
const pathExists = require('path-exists').sync;
const commander = require('commander');
const userHome = require('user-home');
const log = require('@dapp-cli/log');
const exec = require('@dapp-cli/exec');

const pkg = require('../package.json');
const constant = require('./const');

const program = new commander.Command();

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
    if (program.debug) {
      console.log(e);
    }
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', 'Is debug mode on?', false)
    .option('-tp, --targetPath <targetPath>', 'Is the local debug file path specified?', '');

  program
    .command('init [projectName]')
    .option('-f, --force', 'Does it force the directory to be overwritten for initialization?')
    .action(exec);
  
  // debug mode
  program.on('option:debug', function() {
    const options = program.opts();
    if (options.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });

  // targetPath
  program.on('option:targetPath', function() {
    const options = program.opts();
    process.env.CLI_TARGET_PATH = options.targetPath;
  });

  // Listening for unknown commands
  program.on('command:*', function(obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log('Unknown command:' + obj[0]);
    if (availableCommands.length > 0) {
      console.log('Available commands：' + availableCommands.join(','));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

async function prepare() {
    checkPkgVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpdate();
}

async function checkGlobalUpdate() {
  // 1. get current version no and the module name.
  // 2. call npm api, get all version no.
  // 3. compare version no.
  // 4. get latest version no and notice the user to update to latest version.
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmSemverVersion } = require('@dapp-cli/get-npm-info');
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn('Notice', colors.yellow(`Please manually update ${npmName} to the latest version ${lastVersion}.`));
  }
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: path.resolve(userHome, '.env')
    });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('The current login user\'s home directory does not exist.'));
  }
}

function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
}

function checkPkgVersion() {
  log.notice('cli', pkg.version);
}
