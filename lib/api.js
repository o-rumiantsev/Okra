'use strict';

global.api = {};

const nodeModules = [
  'buffer', 'child_process', 'cluster',
  'console', 'crypto', 'dns', 'domain',
  'events', 'fs', 'http', 'https', 'net',
  'os', 'path', 'process', 'readline',
  'stream', 'timers', 'tls', 'dgram',
  'url', 'util', 'v8', 'vm', 'zlib'
];

const npmModules = [
  'mongodb', 'common-toolkit'
];


nodeModules.forEach(
  module => Object.assign(
    api, { [module]: require(module) }
  )
);

try {
  npmModules.forEach(module => {
    const assignment = {};

    if (module === 'common-toolkit') {
      assignment['tools'] = require(module);
    } else {
      assignment[module] = require(module);
    }

    Object.assign(api, assignment);
  });
} catch (error) {
  framework.colorify.error.log(error.message);
}

Object.assign(api, {
  info: framework.colorify.info,
  debug: framework.colorify.debug,
  error: framework.colorify.error,
  warning: framework.colorify.warning,
})
