'use strict';

const { URL } = require('url');
const fs = require('fs');
const tools = require('common-toolkit');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const application = require('./lib/application.js');
const db = require('./lib/db.js');

const api = {
  tools,
};

const sandbox = scripts.createSandbox();
const runScript = scripts.prepareScriptRunner(api, sandbox);

let applicationServer = null;
let database = null;

const start = callback => tools.async
  .sequential([
    readConfig,
    initDb,
    runScripts,
    createApp
  ], (err, data) => {
    if (err) {
      callback(err);
      return;
    }

    applicationServer = data.server;

    callback(null);
  });

const stop = () => (
  applicationServer.close(),
  database.close(),
  applicationServer = null,
  database = null
);

function readConfig(data, callback) {
  const configPath = './config/';

  fs.readdir(configPath, (err, files) => {
    if (err) {
      callback(err);
      return;
    }

    const config = {};
    const extension = /\..*/;

    files.forEach(file => {
      file = file.replace(extension, '');
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
  database = db();
  const url = new URL(config.application.db);
  const { protocol, host } = url;
  const dbUrl = protocol + '//' + host;
  const dbName = url.pathname.substring(1);

  database.connect(dbUrl, err => {
    if (err) {
      callback(err);
      return;
    }

    database.open(dbName, err => {
      if (err) {
        callback(err);
        return;
      }

      api.db = database;
      callback(null);
    });
  });
}

function runScripts({ config }, callback) {
  const applicationScripts = application
    .getApplicationScripts(config.application);

  scripts.runApplicationScripts(
    applicationScripts,
    runScript,
    callback
  );
}

function createApp({ config }, callback) {
  application.createApp(
    config.application.directory,
    api,
    sandbox,
    (err, app) => {
      if (err) {
        callback(err);
        return;
      }

      const startedServer = server
        .boundServer(app, config.server);

      callback(null, { server: startedServer });
    }
  );
}


start(err => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Server bound');
});

module.exports = {
  start,
  stop
}
