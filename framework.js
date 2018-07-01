'use strict';

const tools = require('common-toolkit');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const applications = require('./lib/applications.js');

const config = {
  application: {
    directory: './application'
  },

  modules: ['http', 'https'],

  server: {
    port: 3000,
    host: 'localhost'
  }
};

const api = {
  tools,
};

config.modules
  .forEach(
    module => Object.assign(
      api, { [module]: require(module) }
    )
  );

const applicationScripts = applications
  .getApplicationScripts(config.application);

const sandbox = scripts.createSandbox();
const runner = scripts.prepareRunner(api, sandbox);

scripts.runApplicationScripts(
  applicationScripts,
  runner
);

applications.createApp(
  config.application.directory,
  api,
  sandbox,
  (err, app) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    server.boundServer(app, config.server);
    console.log('Server bound');
  }
);
