'use strict';

const vm = require('vm');
const fs = require('fs');
const tools = require('common-toolkit');

const PARSING_TIMEOUT = 1000;

const createSandbox = (context = {}) => {
  Object.assign(context, {
    module: {}
  });

  context.global = context;
  return vm.createContext(context);;
};

const prepareRunner = (api, sandbox) =>
  (filename, done) => fs.readFile(filename, (err, src) => {
    if (err) {
      done(err);
      return;
    };

    src = `api => { ${src} };`;

    let script;
    try {
      script = vm.createScript(
        src,
        { timeout: PARSING_TIMEOUT }
      );
    } catch (error) {
      callback(error);
      return;
    }

    const fn = script.runInNewContext(sandbox);
    fn(api);
    done(null);
  });

const prepareBuilder = (application, api, sandbox) =>
  ({ url, path, method }, done) => fs.readFile(path, (err, src) => {
    if (err) {
      done(err);
      return;
    };

    if (!src.length) src = tools.common.doNothing;

    src = `(application, api) => ${src}`;

    let script;
    try {
      script = vm.createScript(
        src,
        { timeout: PARSING_TIMEOUT }
      );
    } catch (error) {
      callback(error);
      return;
    }

    const fn = script.runInNewContext(sandbox);
    const handler = fn(application, api);
    const handlers = application.api.get(url);

    if (handlers) {
      handlers[method] = handler;
    } else {
      const methods = {};
      methods[method] = handler;
      application.api.set(url, methods);
    }

    done(null);
  });


const requireFiles = (
  files,
  runner
) => (data, callback) => tools.async
  .each(
    files,
    runner,
    callback
  );

const runApplicationScripts = (
  directories,
  runner,
  callback
) => {
  const fns = directories.map(
    files => requireFiles(files, runner)
  );

  tools.async.sequential(fns, callback);
};

module.exports = {
  createSandbox,
  prepareRunner,
  prepareBuilder,
  runApplicationScripts
};
