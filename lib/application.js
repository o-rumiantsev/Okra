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

const isDirectory = directory => path => fs
  .lstatSync(directory + path)
  .isDirectory();

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

    const directories = files
      .filter(isDirectory(root + url))
      .map(file => root + url + file + '/');

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

  const filterDone = files => files.filter(
    file => (
      file = file.replace(EXTENSION, '.done'),
      !files.includes(file)
    )
  );

  const readdir = dir => {
    let files = fs.readdirSync(dir);
    if (dir.endsWith('/setup/')) files = filterDone(files);
    return files.map(file => dir + file);
  };

  const markSetupDone = directory => {
    const folder = directory + '/setup/';
    const files = fs.readdirSync(folder);
    const doneFiles = files.map(
      file => file.replace(EXTENSION, '.done')
    );

    const doneMessage = new Date().toISOString();

    const createDoneFile = file => {
      const path = folder + file;
      fs.writeFileSync(path, doneMessage);
    };

    doneFiles.map(createDoneFile);
  };

  const files = path.map(readdir);
  markSetupDone(directory);

  return files;
};

module.exports = {
  createApp,
  getApplicationScripts
};
