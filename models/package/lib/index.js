'use strict';

const path = require('path');
const pkgDir = require('pkg-dir').sync;
const npminstall = require('npminstall');
const { isObject } = require('@dapp-cli/utils');
const formatPath = require('@dapp-cli/format-path');
const { getDefaultRegistry } = require('@dapp-cli/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('The options parameter cannot be empty.');
    }
    if (!isObject(options)) {
      throw new Error('The options must be Object type.');
    }
    // target path of the package
    this.targetPath = options.targetPath;
    // the cache path
    this.storeDir = options.storeDir;
    // name of the package
    this.packageName = options.packageName;
    // version of the package
    this.packageVersion = options.packageVersion;
  }

  // Does the current package exist
  exists() {

  }

  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        { name: this.packageName, version: this.packageVersion }
      ]
    });
  }

  update() {

  }

  // get the entry file path
  getRootFilePath() {
    const dir = pkgDir(this.targetPath);
    if (dir) {
      const pkgFile = require(path.resolve(dir, 'package.json'));
      if (pkgFile && pkgFile.main) {
        return formatPath(path.resolve(dir, pkgFile.main));
      }
    }
    return null;
  }
}

module.exports = Package;
