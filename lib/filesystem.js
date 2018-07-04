'use strict';

const FS_WATCH_DELAY = 1000;
const EXTENSION = /\..*/;

const METHODS = http.METHODS
  .map(method => method.toLowerCase())
  .map(method => method + '.js');

const isDirectory = directory => path => fs
  .lstatSync(directory + '/' + path)
  .isDirectory();

const getURL = (root, path) => {
  let url = path.replace(new RegExp(root + '/?'), '/');

  if (url.length > 1 && url.endsWith('/')) {
    url = url.substring(0, url.lastIndexOf('/'));
  }

  return url;
};

const makePath = (root, url, file) =>
  root + (url === '/' ? '/' : url + '/') + file;

const toMethod = filename => filename
  .toUpperCase()
  .replace(EXTENSION, '');

const watchApiDirectory = (resetHandler, root, path) => {
  const url = getURL(root, path);

  let fsWait = false
  fs.watch(path, (eventType, file) => {
    if (fsWait) return;

    fsWait = true;
    setTimeout(() => (fsWait = false), FS_WATCH_DELAY);

    if (eventType === 'change' && METHODS.includes(file)) {
      const handlerUpdate = {
        url,
        path: makePath(root, url, file),
        method: toMethod(file)
      };
      resetHandler(handlerUpdate, err => console.error(err || ''));
    }
  });

  const directories = fs
    .readdirSync(path)
    .filter(isDirectory(path))
    .map(directory => path + '/' + directory)

  directories.forEach(
    directory => watchApiDirectory(resetHandler, root, directory)
  );
};

const prepareApiWatcher = (application, api, sandbox) => {
  const resetHandler = scripts
    .prepareHandlerSetter(application, api, sandbox);

  return watchApiDirectory.bind(null, resetHandler);
};

module.exports = {
  prepareApiWatcher
}
