'use strict';

const EventEmitter = okra.events;
const FS_WATCH_DELAY = 500;

api.Watcher = function(directory) {
  this.delayed = false;
  this.directory = directory;
};

okra.util.inherits(api.Watcher, EventEmitter);

api.Watcher.prototype.isDirectory = directory =>
  path => okra.fs
    .lstatSync(directory + path)
    .isDirectory();

api.Watcher.prototype.onChange = function(
  path,
  eventType,
  filename
) {
  if (this.delayed) return;

  this.delayed = true;
  okra.timers.setTimeout(
    () => this.delayed = false,
    FS_WATCH_DELAY
  );

  this.emit(eventType, path, filename);
};

api.Watcher.prototype.watch = function(path = this.directory) {
  okra.fs.watch(path, this.onChange.bind(this, path));

  const directories = okra.fs
    .readdirSync(path)
    .filter(this.isDirectory(path))
    .map(directory => path + directory + '/');

  directories.forEach(
    directory => this.watch(directory)
  );
};
