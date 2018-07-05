'use strict';

global.api = {};

api.log = framework.log;

framework.config.modules.forEach(module => {
  const assignment = {};

  if (module === 'common-toolkit') {
    assignment['tools'] = require(module);
  } else {
    assignment[module] = require(module);
  }

  Object.assign(api, assignment);
});
