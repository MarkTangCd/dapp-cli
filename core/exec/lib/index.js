'use strict';

const Package = require('@dapp-cli/package');
const log = require('@dapp-cli/log');

const SETTINGS = {
  init: '@dapp-cli/init'
};

function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';

  if (!targetPath) {
    targetPath = ''; // Generate cache path
  }

  const pkg = new Package({
    targetPath,
    packageName,
    packageVersion
  });
  console.log(pkg.getRootFilePath());
  // 1. targetPath -> modulePath
  // 2. modulePath -> Package(npm module)
  // 3. Package.getRootFile(get the entry file)
  // 4. Package.update / Package.install

}

module.exports = exec;
