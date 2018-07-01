'use strict';

const http = require('http');
const https = require('https');
const tools = require('common-toolkit');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const applications = require('./lib/applications.js');

const APP_DIR = './application';

const config = {
  port: 3000,
  host: 'localhost'
};

const api = {
  tools,
  http,
  https
};

const lib = [
  'api.application.js',
  'api.requests.js'
]
  .map(path => APP_DIR + '/lib/' + path);

const sandbox = scripts.createSandbox();
const runner = scripts.prepareRunner(api, sandbox);

scripts.runApplicationScripts(
  [lib],
  runner
);

applications.createApp(
  APP_DIR,
  api,
  sandbox,
  (err, app) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    server.boundServer(app, config);
    console.log('Server bound');
  }
);
