'use strict';

const { URL } = require('url');
const fs = require('fs');
const tools = require('common-toolkit');

const scripts = require('./lib/scripts.js');
const server = require('./lib/server.js');
const application = require('./lib/application.js');
const db = require('./lib/db.js');
const colorify = require('./lib/colors.js');

const api = {
  tools,
  success: colorify.success,
  fail: colorify.fail,
  info: colorify.info,
  error: colorify.error,
  debug: colorify.debug,
  warning: colorify.warning
};

const sandbox = scripts.createSandbox();
const runScript = scripts.prepareScriptRunner(api, sandbox);

let applicationServer = null;
let database = null;

const start = () => tools.async
  .sequential([
    readConfig,
    initDb,
    runScripts,
    createApp
  ], (err, data) => {
    if (err) {
      api.fail.log(err);
      return;
    }

    applicationServer = data.server;
    api.success.log('Framework successfully started');
  });

const stop = () => (
  applicationServer.close(),
  database.close(),
  applicationServer = null,
  database = null,
  api.info.log('Framework stopped'),
  process.exit(0)
);

function readConfig(data, callback) {
  const currentDir = process.cwd();
  const configPath = currentDir + '/config/';

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


start();

setTimeout(() => stop(), 2000);

module.exports = {
  start,
  stop
}
