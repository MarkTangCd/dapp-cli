'use strict';

const path = require('path');
const Package = require('@dapp-cli/package');
const log = require('@dapp-cli/log');
const { exec: spawn } = require('@dapp-cli/utils');

const SETTINGS = {
  init: '@dapp-cli/init'
};

const CACHE_DIR = 'dependencies';

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = '';
  let pkg;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // Generate cache path
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    });
    if (await pkg.exists()) {
      // update the package
      await pkg.update();
    } else {
      // install the package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    });
  }
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    try {
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent') {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      child.on('error', error => {
        log.error(error.message);
        process.exit(1);
      });
      child.on('exit', result => {
        log.verbose('Command executed successfully:' + result);
        process.exit(result);
      });
    } catch(e) {
      log.error(e.message);
    }
    // child process
  }
  // 1. targetPath -> modulePath
  // 2. modulePath -> Package(npm module)
  // 3. Package.getRootFile(get the entry file)
  // 4. Package.update / Package.install

}

module.exports = exec;
