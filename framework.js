'use strict';

const { URL } = require('url');
const fs = require('fs');
const tools = require('common-toolkit');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const applications = require('./lib/applications.js');
const mongoWrapper = require('./lib/mongoWrapper.js');

const api = {
  tools,
};

const sandbox = scripts.createSandbox();
const runner = scripts.prepareRunner(api, sandbox);

tools.async.sequential([
  readConfig,
  initDb,
  runScripts,
  createApp
], err => {
  if (err) console.error(err);
});

function readConfig(data, callback) {
  const configPath = './config/';

  fs.readdir(configPath, (err, files) => {
    if (err) {
      callback(err);
      return;
    }

    const config = {};

    files.forEach(file => {
      file = file.replace(/\..*/, '');
      config[file] = require(configPath + file);
    });

    config.modules.forEach(
      module => Object.assign(
        api, { [module]: require(module) }
      )
    );

    callback(null, { config });
  });
}

function initDb({ config }, callback) {
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

function runScripts({ config }, callback) {
  const applicationScripts = applications
    .getApplicationScripts(config.application);

  scripts.runApplicationScripts(
    applicationScripts,
    runner,
    callback
  );
}

function createApp({ config }, callback) {
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
