#! /usr/bin/env node

const importLocal = require('import-local');

if (importLocal(__filename)) {
  require('npmlog').info('cli', 'dapp-cli local version is being used');
} else {
  require('../lib')(process.argv.slice(2));
}
