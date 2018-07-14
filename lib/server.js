'use strict';

const processRequest = (req, res) => {
  const application = okra.application;
  const handlers = application.handlers.api.get(url);

  if (handlers && (method in handlers)) {
    const handler = handlers[method];
    const client = { req, res };

    const callback = err => {
      if (err) {
        okra.log.error(err);
      }
      res.end();
    };

    handler(client, callback);
  }
};

const onRequest = (req, res) => {
  const url = req.url;
  const method = req.method;

  if (okra.application) processRequest(req, res);
};

okra.server = okra.http.createServer(onRequest);

okra.server.start = () => (
  okra.server.listen(okra.PORT, okra.HOST),
  okra.started = true
);

okra.server.restart = () => {
  okra.log.warning('Okra server restarting'),
  okra.server.close();
  okra.server.start();
  okra.log.info('Okra server restarted');
};
