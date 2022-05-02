'use strict';

const path = require('path');
const pkgDir = require('pkg-dir').sync;
const { isObject } = require('@dapp-cli/utils');
const formatPath = require('@dapp-cli/format-path');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空!');
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为Object!');
    }
    // target path of the package
    this.targetPath = options.targetPath;
    // name of the package
    this.packageName = options.packageName;
    // version of the package
    this.packageVersion = options.packageVersion;
  }

  // Does the current package exist
  exists() {

  }

  install() {

  }

  update() {

  }

  // get the entry file path
  getRootFilePath() {
    const dir = pkgDir(this.targetPath);
    console.log(dir);
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
