'use strict';

const processRequest = (client, callback) => {
  const { url, method } = client.req;
  const { application } = okra;
  const handlers = application.handlers.api.get(url);

  if (handlers && (method in handlers)) {
    const handler = handlers[method];


    handler(client, callback);
  }
};

const onRequest = (req, res) => {
  const client = { req, res };
  const callback = err => {
    if (err) {
      okra.log.error(err);
    }
    res.end();
  };

  if (okra.application) processRequest(client, callback);
};

okra.server = okra.http.createServer(onRequest);

okra.server.start = () => (
  okra.server.listen(okra.PORT, okra.HOST),
  okra.started = true
);

okra.server.restart = () => {
  okra.log.warning('Okra server restarting');
  okra.server.close();
  okra.server.start();
  okra.log.info('Okra server restarted');
};
