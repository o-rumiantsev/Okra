'use strict';

global.okra = {};

require('./config.js');

okra.HTTP_PORT = okra.config.server.http.port;
okra.HTTP_HOST = okra.config.server.http.host;

okra.JSTP_PORT = okra.config.server.jstp.port;
okra.JSTP_HOST = okra.config.server.jstp.host;

require('./colors.js');
require('./log.js');

require('./errors.js');
require('./modules.js');

okra.getJSTPConnections = okra.tools.common.doNothing;

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
    okra.addApplication(() => {});
  }
};

okra.addApplication = callback => application
  .loadApplication(err => {
    if (err) {
      okra.log.error(err);
      callback(err);
      return;
    }

    if (okra.application.RPCReady) {
      const jstpApp = new okra.jstp.Application(
        okra.application.name,
        okra.application.rpcApi
      );

      okra.server.jstp = okra.jstp.ws.createServer([jstpApp]);
      okra.server.jstp.listen(okra.JSTP_PORT, okra.JSTP_HOST);
      api.getJSTPConnections = okra.server.jstp.getClientsArray.bind(
        okra.server.jstp
      );
    }

    okra.log.info('Application loaded');
    callback(null);
  });

okra.shutdown = () => {
  okra.started = false;
  okra.server.stop();
  if (api.mohican.provider) api.mohican.close();
  okra.log.info('Okra shutdown');
  process.exit(0);
};

const EXIT_SIGNALS = ['SIGINT', 'SIGTERM'];

EXIT_SIGNALS.forEach(
  signal => process.on(signal, () => okra.shutdown())
);
