'use strict';

global.framework = {};

require('./config.js');

framework.PORT = framework.config.server.port;
framework.HOST = framework.config.server.host;

require('./colors.js');
require('./api.js');
require('./errors.js')
require('./db.js');

const application = require('./application.js');

framework.start = () => {
  application.loadApplication((err, app) => {
    if (err) {
      api.error.log(err);
      process.exit(1);
    }

    require('./server.js');

    try {
      framework.server.start();
      api.info.log('Framework started');
      process.on('uncaughtException', err => {
        api.error.log(err);
        framework.server.restart();
      });
    } catch (error) {
      api.error.log(error);
    }
  });
};

framework.shutdown = () => {
  framework.server.close();
  api.db.close();
  api.info.log('Framework shutdown');
  process.exit(0);
};
