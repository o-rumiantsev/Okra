'use stirct';

Object.assign(framework, {
  ERR_CANNOT_LOAD_DB: new Error('Cannot load database'),

  ERR_NOT_CONNECTED_TO_DB: new Error(
    'Cannot open database while not connected'
  ),

  ERR_CATEGORY_REQUIRED: new Error('entry category required'),
});

process.on('uncaughtException', err => {
  api.error.log(err);

  if (framework.started) {
    framework.server.restart();
  }
})
