'use strict';

const http = require('http');
const https = require('https');
const tools = require('tools');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const { createApp } = require('./lib/applications.js');

const config = {
  port: 3000,
  host: 'localhost'
};

const api = {
  tools,
  http,
  https
};

const libFiles = [
  'api.application.js',
  'api.requests.js'
]
  .map(path => './application/lib/' + path);

const apiFiles = [
  'test.js'
]
  .map(path => './application/api/' + path);

const sandbox = scripts.createSandbox();
const runScriptFromFile = scripts.injectApiToSandbox(api, sandbox);

scripts.runApplicationScripts(
  [libFiles],
  runScriptFromFile
);

const app = {};
const preparedApp = scripts.prepareApplication(app, sandbox);

applications.createApp(
  appDir,
  preparedApp,
  err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    server.boundServer(app, config);
    console.log('Server bound');
  }
);
