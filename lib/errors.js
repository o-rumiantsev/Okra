'use stirct';

Object.assign(okra, {
  ERR_DB_CONFIG_REQUIRED: new Error(
    'Application database config required'
  )
});

process.on('uncaughtException', err => {
  okra.log.error(err);

  if (okra.started && okra.application) {
    okra.server.restart();
  }
})
