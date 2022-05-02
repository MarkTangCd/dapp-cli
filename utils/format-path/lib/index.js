'use strict';

const path = require('path');

module.exports = function formatPath(p) {
  if (p) {
    const sep = path.sep;
    if (sep === '/') {
      return p;
    } else {
      return p.replace(/\\/g, '/');
    }
  }
  return p;
}
