'use strict';

const EventEmitter = api.events;
const FS_WATCH_DELAY = 500;

api.Watcher = function(directory) {
  this.delayed = false;
  this.directory = directory;
}

api.util.inherits(api.Watcher, EventEmitter);

api.Watcher.prototype.isDirectory = directory =>
  path => api.fs
    .lstatSync(directory + path)
    .isDirectory()

api.Watcher.prototype.onChange = function(
  path,
  eventType,
  filename
) {
  if (this.delayed) return;

  this.delayed = true;
  api.timers.setTimeout(
    () => (this.delayed = false),
    FS_WATCH_DELAY
  );

  this.emit(eventType, path, filename);
}

api.Watcher.prototype.watch = function(path = this.directory) {
  api.fs.watch(path, this.onChange.bind(this, path));

  const directories = api.fs
    .readdirSync(path)
    .filter(this.isDirectory(path))
    .map(directory => path + directory + '/');

  directories.forEach(
    directory => this.watch(directory)
  );
}
