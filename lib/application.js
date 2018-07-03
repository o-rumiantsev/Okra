'use strict';

const fs = require('fs');
const http = require('http');
const tools = require('common-toolkit');
const scripts = require('./scripts.js');

const SCRIPT_FOLDERS = [
  '/setup/', '/init/', '/lib/', '/db/'
];

const METHODS = http.METHODS
  .map(method => method.toLowerCase())
  .map(method => method + '.js');

const EXTENSION = /\..*/;

const setHandlersOnURL = (
  url,
  handlers,
  setHandler,
  callback
) => {
  if (url.length > 1 && url.endsWith('/')) {
    url = url.substring(0, url.lastIndexOf('/'));
  }

  handlers = handlers
    .map(handler => Object.assign(handler, { url }))

  tools.async.each(
    handlers,
    setHandler,
    callback
  );
};

const inspectDirectory = (
  root,
  path,
  setHandler,
  callback
) => {
  fs.readdir(path, (err, files) => {
    if (err) {
      callback(err);
      return;
    }

    const url = path.replace(new RegExp(root + '/?'), '/');
    const handlers = files.filter(
      file => METHODS.some(method => method === file)
    )
      .map(file => (
        {
          path: root + url + file,
          method: file.toUpperCase().replace(EXTENSION, '')
        }
      ));

    const directories = files.filter(
      file => !METHODS.some(method => method === file)
    ).map(file => root + url + file + '/');

    setHandlersOnURL(url, handlers, setHandler, err => {
      if (err) {
        callback(err);
        return;
      }

      const inspect = (dir, done) =>
        inspectDirectory(root, dir, setHandler, done);

      tools.async.each(directories, inspect, callback);
    });
  });
};

const createApp = (
  appDir,
  api,
  sandbox,
  callback
) => {
  const root = appDir + '/api';

  const application = {
    api: new Map()
  };

  const setHandler = scripts
    .prepareHandlerSetter(application, api, sandbox);

  inspectDirectory(
    root,
    root,
    setHandler,
    err => callback(err, application)
  );
};

const getApplicationScripts = ({ directory }) => {
  const path = SCRIPT_FOLDERS.map(folder => directory + folder);

  const readdir = dir => fs
    .readdirSync(dir)
    .map(file => dir + file);

  const files = path.map(readdir);
  return files;
};

module.exports = {
  createApp,
  getApplicationScripts
};
