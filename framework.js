'use strict';

const tools = require('common-toolkit');
const { URL } = require('url');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const applications = require('./lib/applications.js');
const mongoWrapper = require('./lib/mongoWrapper.js');

const config = {
  application: {
    directory: './application',
    db: 'mongodb://localhost:27017/Test'
  },

  modules: ['console', 'http', 'https'],

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


tools.async.sequential([
  initDb,
  runScripts,
  createApp
], err => {
  if (err) console.error(err);
})

function initDb(data, callback) {
  const db = mongoWrapper();
  const url = new URL(config.application.db);
  const { protocol, host } = url;
  const dbUrl = protocol + '//' + host;
  const dbName = url.pathname.substring(1);

  db.connect(dbUrl, err => {
    if (err) {
      callback(err);
      return;
    }

    db.open(dbName, err => {
      if (err) {
        callback(err);
        return;
      }

      api.db = db;
      callback(null);
    });
  });
}

function runScripts(data, callback) {
  scripts.runApplicationScripts(
    applicationScripts,
    runner,
    callback
  );
}

function createApp(data, callback) {
  applications.createApp(
    config.application.directory,
    api,
    sandbox,
    (err, app) => {
      if (err) {
        callback(err);
        return;
      }

      server.boundServer(app, config.server);
      console.log('Server bound');
      callback(null)
    }
  );
}
