'use strict';

const vm = require('vm');
const fs = require('fs');
const tools = require('tools');

const PARSING_TIMEOUT = 1000;

const createSandbox = (context = {}) => {
  Object.assign(context, {
    module: {},
    console,
  });

  context.global = context;
  return vm.createContext(context);;
};

const injectApiToSandbox = (api, sandbox) =>
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

  const prepareApplication = (app, sandbox) =>
    (path, done) => fs.readFile(path, (err, src) => {
      if (err) {
        done(err);
        return;
      };

      src = `app => {
        tools.common.insertByDotPath(app, ${src})
      };`;

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
      fn(app);
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
  runner
) => {
  const fns = directories.map(
    files => requireFiles(files, runner)
  );

  tools.async.sequential(fns, err => (
    err ?
      (
        console.error(err),
        process.exit(1)
      ) :
      tools.common.doNothing()
  ));
};

module.exports = {
  createSandbox,
  injectApiToSandbox,
  runApplicationScripts
};
