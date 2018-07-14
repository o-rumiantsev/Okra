'use strict';

global.okra = {};

require('./config.js');

okra.PORT = okra.config.server.port;
okra.HOST = okra.config.server.host;

require('./colors.js');
require('./log.js');

require('./errors.js');
require('./modules.js');

require('./api.js');
require('./api.mohican.js');
require('./api.Watcher.js');

const application = require('./application.js');

okra.start = () => {
  require('./server.js');

  try {
    okra.server.start();
    okra.log.info('Okra started');
  } catch (error) {
    okra.log.error(error);
  }

  if (okra.config.application) {
    okra.addApplication(() => {
    });
  }
};

okra.addApplication = callback => application
  .loadApplication(err => {
    if (err) {
      okra.log.error(err);
      callback(err);
      return;
    }

    okra.log.info('Application loaded');
    callback(null);
  });

okra.shutdown = () => {
  okra.started = false;
  okra.server.close();
  if (api.mohican.provider) api.mohican.close();
  okra.log.info('Okra shutdown');
  process.exit(0);
};


const EXIT_SIGNALS = ['SIGINT', 'SIGTERM'];

EXIT_SIGNALS.forEach(
  signal => process.on(signal, () => okra.shutdown())
);
