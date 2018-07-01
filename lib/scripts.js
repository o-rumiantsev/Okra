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
    } catch (e) {
      console.error(new Error('Parsiong timeout'));
      process.exit(1);
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
      } catch (e) {
        console.error(new Error('Parsiong timeout'));
        process.exit(1);
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
    err => (
      err ?
        callback(err) :
        callback(null)
    )
  );

const runApplicationScripts = (
  directories,
  runner,
  callback
) => {
  const fns = directories.map(
    files => requireFiles(files, runner)
  );

  tools.async.sequential(fns, err => (
    err ?
      callback(err) :
      callback(null)
  ));
};

module.exports = {
  createSandbox,
  prepareRunner,
  prepareBuilder,
  runApplicationScripts
};
