'use strict';

const Command = require('@dapp-cli/command');
const log = require('@dapp-cli/log');

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }

  exec() {
    console.log('exec logic.');
  }
}

function init(argv) {
  console.log('argv:');
  console.log(argv);
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
