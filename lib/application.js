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

const isDirectory = directory => path => okra.fs
  .lstatSync(directory + path)
  .isDirectory();

const pathToFile = (currentDirectory, file) =>
  currentDirectory + file;

const pathToDirectory = (currentDirectory, dir) =>
  currentDirectory + dir + '/';

const buildHandlerInfo = (currentDirectory, url, file) => {
  const path = pathToFile(currentDirectory, file);

  const method = file
    .toUpperCase()
    .replace(EXTENSION, '');

  // '/url/' -> '/url'
  url = url === '/'
    ? url
    : url.substring(0, url.lastIndexOf('/'));

  return { url, path, method };
};

application.HTTP_HANDLERS = okra.http.METHODS
  .map(method => method.toLowerCase())
  .map(method => method + '.js');

application.createSandbox = (context = {}) => {
  Object.assign(context, {
    global: context,
    module: {}
  });

  application.sandbox = okra.vm.createContext(context);
};

application.wrapCode = (src, isJstp = false) => {
  if (!src.length) src = okra.tools.common.doNothing.toString();
  const isFunc = src.startsWith(BRACE_OPENING);

  const wrapFunc = () => (
    src = isJstp
      ? src.replace(BRACE_OPENING, '(connection, ')
      : src,
    `api => ${src}`
  );

  const code = isFunc
    ? wrapFunc()
    : `api => { ${src} }`;

  return USE_STRICT + code;
};

application.createScript = (filename, isJstp = false) => {
  try {
    const source = okra.fs.readFileSync(filename, 'utf8');
    const code = application.wrapCode(source, isJstp);
    const script = okra.vm
      .createScript(code, { timeout: PARSING_TIMEOUT });

    const fn = script.runInNewContext(application.sandbox);
    return fn;
  } catch (error) {
    api.log.error(error);
    return okra.tools.common.doNothing;
  }
};

application.loadDatabase = callback => {
  const config = okra.config.application.database;

  if (!config) {
    callback(okra.ERR_DB_CONFIG_REQUIRED);
    return;
  }

  const url = new okra.url.URL(config);
  const dbName = url.pathname.substring(1);

  url.pathname = '';
  const dbURL = url.toString();

  const connect = (data, cb) => application
    .connectToDatabase(dbURL, cb);

  const open = (data, cb) => application
    .openDatabase(dbName, (err, db) => cb(err, { db }));

  okra.tools.async.sequential([connect, open], callback);
};

application.connectToDatabase = (
  databaseURL,
  callback
) => api.mohican.connect(databaseURL, callback);

application.openDatabase = (
  databaseName,
  callback
) => api.mohican.open(databaseName, callback);

application.getScripts = path => {
  const filterDone = files => files.filter(file => (
    file = file.replace(EXTENSION, '.done'),
    !files.includes(file)
  ));

  const readdir = dir => {
    let files = okra.fs.readdirSync(dir);

    if (dir.endsWith('/setup/')) {
      files = filterDone(files);

      const doneMessage = new Date().toISOString();
      const doneFiles = files.map(
        file => file.replace(EXTENSION, '.done')
      );

      doneFiles.forEach(file => {
        const donePath = dir + file;
        okra.fs.writeFileSync(donePath, doneMessage);
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
  const applicationDirectory = okra.config.application.directory;
  const path = SCRIPT_FOLDERS.map(
    folder => applicationDirectory + folder
  );

  const scriptFiles = application.getScripts(path);

  scriptFiles.forEach(files => files
    .forEach(file => application.require(file))
  );
};

application.setHandler = (httpApi, { url, path, method }) => {
  const fn = application.createScript(path);
  const handler = fn(api);
  const handlers = httpApi.get(url);

  if (handlers) {
    handlers[method] = handler;
  } else {
    const methods = {};
    methods[method] = handler;
    httpApi.set(url, methods);
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
    const files = okra.fs.readdirSync(currentDirectory);

    const root = new RegExp(apiDirectory + '/?');
    const url = currentDirectory.replace(root, '/api/');
    const path = currentDirectory;

    const handlers = files
      .filter(
        file => application.HTTP_HANDLERS
          .some(handler => handler === file)
      )
      .map(buildHandlerInfo.bind(null, path, url));

    const directories = files
      .filter(isDirectory(currentDirectory))
      .map(dir => pathToDirectory(currentDirectory, dir));

    handlers.forEach(setHandler);
    directories.forEach(
      directory => application
        .loadHandlersFromDirectory(apiDirectory, directory, setHandler)
    );
  } catch (error) {
    api.log.error(error);
  }
};

application.loadHandlers = app => {
  const apiDirectory = okra.config.application.directory + '/api/http/';
  const setHandler = application.setHandler.bind(null, app);

  application.loadHandlersFromDirectory(apiDirectory, setHandler);
};

application.setRPCMethod = (rpcApi, path, method) => {
  const isJstp = true;
  const fn = application.createScript(path + method, isJstp);
  const methodName = method.replace(EXTENSION, '');
  rpcApi[methodName] = fn(api);
};

application.loadRPCMethods = (
  rpcDirectory,
  interfaceName
) => {
  const path = rpcDirectory + interfaceName + '/';
  const methodNames = okra.fs.readdirSync(path);
  const rpcApi = {};

  methodNames.forEach(method => application
    .setRPCMethod(rpcApi, path, method)
  );

  return api;
};

application.loadRPC = app => {
  const rpcDirectory = okra.config.application.directory + '/api/jstp/';
  const exists = okra.fs.existsSync(rpcDirectory);

  if (!exists) return;

  app.rpcApi = {};
  app.RPCReady = true;

  try {
    const interfaces = okra.fs.readdirSync(rpcDirectory);
    interfaces.forEach(
      interfaceName => app.rpcApi[interfaceName] = application
        .loadRPCMethods(rpcDirectory, interfaceName)
    );
  } catch (error) {
    api.log.error(error);
  }
};

application.readHtml = staticDirectory => {
  const path = staticDirectory + 'index.html';

  const readHtml = () => {
    try {
      const html = okra.fs.readFileSync(path, 'utf8');
      return html;
    } catch (error) {
      api.log.error(error);
      return '';
    }
  };

  return readHtml;
};

application.loadStatic = app => {
  const staticDirectory = okra.config.application.directory + '/static/';
  const routing = okra.config.routing || ['/'];
  app.routing = new Set(routing);
  app.readHtml = application.readHtml(staticDirectory);
};

application.createApplication = () => {
  const app = {};
  app.name = okra.config.application.name;
  app.handlers = {};
  app.handlers.api = new Map();

  application.loadScripts();
  application.loadHandlers(app.handlers.api);
  application.loadRPC(app);
  application.loadStatic(app);

  return app;
};

application.loadApplication = callback => {
  application.loadDatabase((err, { db }) => {
    if (err) {
      callback(err);
      return;
    }

    api.db = db;
    okra.application = application.createApplication();
    application.watchFileSystem();
    callback(null);
  });
};

application.watchFileSystem = () => {
  const app = okra.application;

  const resetHandler = application.setHandler.bind(null, app.handlers.api);
  const resetMethod = application.setRPCMethod.bind(null, app.rpcApi);

  const apiDirectory = okra.config.application.directory + '/api/http/';
  const rpcDirectory = okra.config.application.directory + '/api/jstp/';

  application.watchAPIDirectory(apiDirectory, resetHandler);
  application.watchRPCDirectory(rpcDirectory, resetMethod);
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

    const url = path.replace(root, '/api/');
    const handlerUpdate = buildHandlerInfo(path, url, filename);
    resetHandler(
      handlerUpdate,
      err => api.log.error(err || '')
    );
  });
};

application.watchRPCDirectory = (
  rpcDirectory,
  resetMethod
) => {
  const watcher = new api.Watcher(rpcDirectory);
  watcher.watch();
  watcher.on('change', resetMethod);
};
