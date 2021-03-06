'use strict';

global.api = {};

api.log = okra.log;

if (okra.config.modules) {
  okra.config.modules.forEach(module => {
    const assignment = {};

    if (module === 'common-toolkit') {
      assignment.tools = require(module);
    } else {
      assignment[module] = require(module);
    }

    Object.assign(api, assignment);
  });
}
