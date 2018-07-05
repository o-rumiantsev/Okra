'use strict';

global.framework = {};

require('./config.js');

framework.PORT = framework.config.server.port;
framework.HOST = framework.config.server.host;

require('./colors.js');
require('./log.js');

require('./errors.js');
require('./modules.js');

require('./api.js');
require('./api.db.js');
require('./api.Watcher.js')

const application = require('./application.js');

framework.start = () => {
  application.loadApplication((err, app) => {
    if (err) {
      framework.log.error(err);
      process.exit(1);
    }

    require('./server.js');

    try {
      framework.server.start();
      framework.log.info('Framework started');
    } catch (error) {
      framework.log.error(error);
    }
  });
};

framework.shutdown = () => {
  framework.started = false;
  framework.server.close();
  api.db.close();
  framework.log.info('Framework shutdown');
  process.exit(0);
};


const EXIT_SIGNALS = ['SIGINT', 'SIGTERM'];

EXIT_SIGNALS.forEach(
  signal => process.on(signal, () => framework.shutdown())
);
