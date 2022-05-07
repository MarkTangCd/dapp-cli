'use strict';

const log = require('@dapp-cli/log');
const semver = require('semver');
const colors = require('colors');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error('The parameter cannot be empty.');
    }

    if (!Array.isArray(argv)) {
      throw new Error('The parameter type must be Array.');
    }

    if (argv.length < 1) {
      throw new Error('The parameter cannot be empty.');
    }

    this._argv = argv;
    this.runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch(err => {
        log.error(err.message);
      });
    });
  }

  initArgs() {
    this._cmd = this._argv[1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
  }

  checkNodeVersion() {
    // step1 get current node version no.
    const currentVersion = process.version;
    // step2 compare version no
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`dapp-cli requires Node.js version v${lowestVersion} or higher to be installed.`));
    }
  }

  init() {
    throw new Error('The init function must implement the.');
  }

  exec() {
    throw new Error('The exec function must implement the');
  }
}

module.exports = Command;
