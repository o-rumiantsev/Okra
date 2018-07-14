'use strict';

const nodeModules = [
  'buffer', 'child_process', 'cluster',
  'console', 'crypto', 'dns', 'domain',
  'events', 'fs', 'http', 'https', 'net',
  'os', 'path', 'process', 'readline',
  'stream', 'timers', 'tls', 'dgram',
  'url', 'util', 'v8', 'vm', 'zlib'
];

const npmModules = [
  'mongodb', 'common-toolkit', 'mohican'
];

nodeModules.forEach(
  module => Object.assign(
    okra, { [module]: require(module) }
  )
);

try {
  npmModules.forEach(module => {
    const assignment = {};

    if (module === 'common-toolkit') {
      assignment.tools = require(module);
    } else if (module === 'mohican') {
      assignment.Mohican = require(module);
    } else {
      assignment[module] = require(module);
    }

    Object.assign(okra, assignment);
  });
} catch (error) {
  okra.log.error(error.message);
}
