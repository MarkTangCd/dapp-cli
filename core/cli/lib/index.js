'use strict';

module.exports = core;

const semver = require('semver');
const colors = require('colors');
const pathExists = require('path-exists').sync;
const userHome = require('user-home');
const log = require('@dapp-cli/log');

const pkg = require('../package.json');
const constant = require('./const');

let args;

function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    log.verbose('debug', 'test debug log');
  } catch (e) {
    log.error(e.message);
  }
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
