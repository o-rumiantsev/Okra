'use stirct';

Object.assign(framework, {
  ERR_DB_CONFIG_REQUIRED: new Error(
    'Application database config required'
  )
});

process.on('uncaughtException', err => {
  framework.log.error(err);

  if (framework.started) {
    framework.server.restart();
  }
})
