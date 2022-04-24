'use strict';

module.exports = core;

const path = require('path');
const semver = require('semver');
const colors = require('colors');
const pathExists = require('path-exists').sync;
const userHome = require('user-home');
const log = require('@dapp-cli/log');

const pkg = require('../package.json');
const constant = require('./const');

let args;

async function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
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
  log.verbose('Env', process.env.CLI_HOME_PATH);
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

function checkInputArgs() {
  const minimist = require('minimist');
  args = minimist(process.argv.slice(2));
  console.log(args);
  checkArgs();
}

function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }
  log.level = process.env.LOG_LEVEL;
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('The current login user\'s home directory does not exist.'));
  }
}

function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
  console.log(process.geteuid());
}

function checkNodeVersion() {
  // step1 get current node version no.
  const currentVersion = process.version;
  // step2 compare version no
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`dapp-cli requires Node.js version v${lowestVersion} or higher to be installed.`));
  }
}

function checkPkgVersion() {
  log.notice('cli', pkg.version);
}
