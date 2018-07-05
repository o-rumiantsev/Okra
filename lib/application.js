'use strict';

const application = {};
module.exports = application;

const PARSING_TIMEOUT = 1000;

const USE_STRICT = '\'use strict\';\n';
const BRACE_OPENING = '(';
const EXTENSION = /\..*/;

const SCRIPT_FOLDERS = [
  '/setup/',
  '/init/',
  '/lib/',
];

const isDirectory = directory => path => framework.fs
  .lstatSync(directory + path)
  .isDirectory();

const pathToFile = (apiDirectory, url, file) =>
  apiDirectory + url.substring(1) + file;

const pathToDirectory = (apiDirectory, url, file) =>
  pathToFile(apiDirectory, url, file) + '/';

const buildHandlerInfo = (apiDirectory, url, file) => {
  const path = pathToFile(apiDirectory, url, file);
  const method = file
    .toUpperCase()
    .replace(EXTENSION, '');

  // '/url/' -> '/url'
  url = url === '/' ? url : url.substring(0, url.lastIndexOf('/'));

  return { url, path, method };
};

application.HTTP_HANDLERS = framework.http.METHODS
  .map(method => method.toLowerCase())
  .map(method => method + '.js');

application.createSandbox = (context = {}) => {
  Object.assign(context, {
    global: context,
    module: {}
  });

  application.sandbox = framework.vm.createContext(context);;
};

application.wrapCode = src => {
  if (!src.length) src = framework.tools.common.doNothing.toString();
  const isFunc = src.startsWith(BRACE_OPENING);
  const code = isFunc ? `api => ${src}` : `api => { ${src} }`;
  return USE_STRICT + code;
};

application.createScript = filename => {
  try {
    const source = framework.fs.readFileSync(filename, 'utf8');
    const code = application.wrapCode(source);
    const script = framework.vm
      .createScript(code, { timeout: PARSING_TIMEOUT });

    const fn = script.runInNewContext(application.sandbox);
    return fn;
  } catch (error) {
    api.log.error(error);
    return framework.tools.common.doNothing;
  }
};

application.loadDatabase = callback => {
  const config = framework.config.application.database;
  const url = new framework.url.URL(config);
  const { protocol, host } = url;
  const dbURL = protocol + '//' + host;
  const dbName = url.pathname.substring(1);

  const connect = (data, cb) => application
    .connectToDatabase(dbURL, cb);

  const open = (data, cb) => application
    .openDatabase(dbName, cb);

  framework.tools.async.sequential([connect, open], callback);
};

application.connectToDatabase = (
  databaseURL,
  callback
) => api.db.connect(databaseURL, callback);

application.openDatabase = (
  databaseName,
  callback
) => api.db.open(databaseName, callback);

application.getScripts = path => {
  const filterDone = files => files.filter(file => (
    file = file.replace(EXTENSION, '.done'),
    !files.includes(file)
  ));

  const readdir = dir => {
    let files = framework.fs.readdirSync(dir);

    if (dir.endsWith('/setup/')) {
      files = filterDone(files);

      const doneMessage = new Date().toISOString();
      const doneFiles = files.map(
        file => file.replace(EXTENSION, '.done')
      );

      doneFiles.map(file => {
        const path = dir + file;
        framework.fs.writeFileSync(path, doneMessage);
      });
    }

    return files.map(file => dir + file);
  };

  const files = path.map(readdir);
  return files;
};

application.require = filename => {
  const fn = application.createScript(filename);
  fn(api);
};

application.loadScripts = () => {
  const applicationDirectory = framework.config.application.directory;
  const path = SCRIPT_FOLDERS.map(
    folder => applicationDirectory + folder
  );

  const scriptFiles = application.getScripts(path);

  scriptFiles.forEach(files => files
    .forEach(file => application.require(file))
  );
};

application.setHandler = (app, { url, path, method }) => {
  const fn = application.createScript(path);
  const handler = fn(api);
  const handlers = app.handlers.api.get(url);

  if (handlers) {
    handlers[method] = handler;
  } else {
    const methods = {};
    methods[method] = handler;
    app.handlers.api.set(url, methods);
  }
};

application.loadHandlersFromDirectory = (
  apiDirectory,
  currentDirectory,
  setHandler
) => {
  if (typeof currentDirectory === 'function') {
    setHandler = currentDirectory;
    currentDirectory = apiDirectory;
  }

  try {
    const files = framework.fs.readdirSync(currentDirectory);

    const root = new RegExp(apiDirectory + '/?');
    const url = currentDirectory.replace(root, '/');

    const handlers = files
      .filter(
        file => application.HTTP_HANDLERS
          .some(handler => handler === file)
      )
      .map(buildHandlerInfo.bind(null, apiDirectory, url));

    const directories = files
      .filter(isDirectory(apiDirectory + url))
      .map(file => pathToDirectory(apiDirectory, url, file));

    handlers.forEach(setHandler);
    directories.forEach(
      directory => application
        .loadHandlersFromDirectory(apiDirectory, directory, setHandler)
    );
  } catch (error) {
    api.log.error(error);
  }
}

application.loadHandlers = app => {
  const apiDirectory = framework.config.application.directory + '/api/';
  const setHandler = application.setHandler.bind(null, app);

  application.loadHandlersFromDirectory(apiDirectory, setHandler);
};

application.createApplication = () => {
  const app = {};
  app.handlers = {};
  app.handlers.api = new Map();

  application.loadScripts();
  application.loadHandlers(app);

  return app;
};

application.loadApplication = callback => {
  application.loadDatabase(err => {
    if (err) {
      callback(err);
      return;
    }

    framework.application = application.createApplication();
    application.watchFileSystem();
    callback(null);
  });
};

application.watchFileSystem = () => {
  const app = framework.application;
  const resetHandler = application.setHandler.bind(null, app);
  const apiDirectory = framework.config.application.directory + '/api/';
  application.watchAPIDirectory(apiDirectory, resetHandler);
};

application.watchAPIDirectory = (
  apiDirectory,
  resetHandler
) => {
  const root = new RegExp(apiDirectory + '/?');
  const watcher = new api.Watcher(apiDirectory);

  watcher.watch();

  watcher.on('change', (path, filename) => {
    if (
      !application.HTTP_HANDLERS.includes(filename)
    ) return;

    const url = path.replace(root, '/');
    const handlerUpdate = buildHandlerInfo(apiDirectory, url, filename);
    resetHandler(
      handlerUpdate,
      err => api.log.error(err || '')
    );
  });
};
