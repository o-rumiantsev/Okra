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

const setHandlersOnURL = (
  url,
  handlers,
  builder,
  callback
) => {
  if (url.length > 1 && url.endsWith('/')) {
    url = url.substring(0, url.lastIndexOf('/'));
  }

  handlers = handlers
    .map(handler => Object.assign(handler, { url }))

  tools.async.each(
    handlers,
    builder,
    callback
  );
};

const inspectDirectory = (
  root,
  path,
  builder,
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
          method: file.toUpperCase().replace(/\..*/, '')
        }
      ));

    const directories = files.filter(
      file => !METHODS.some(method => method === file)
    ).map(file => root + url + file + '/');

    setHandlersOnURL(url, handlers, builder, err => {
      if (err) {
        callback(err);
        return;
      }

      const inspector = (dir, done) =>
        inspectDirectory(root, dir, builder, done);

      tools.async.each(directories, inspector, callback);
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

  const builder = scripts
    .prepareBuilder(application, api, sandbox);

  inspectDirectory(
    root,
    root,
    builder,
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
