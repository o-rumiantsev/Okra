'use strict';

const processRequest = (client, callback) => {
  const { url, method } = client.req;
  const { application } = okra;
  const handlers = application.handlers.api.get(url);

  if (application.routing.has(url)) {
    const html = application.readHtml();
    client.res.write(html);
    callback(null);
  } else if (handlers && method in handlers) {
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

const httpServer = okra.http.createServer(onRequest);

okra.server = {
  http: httpServer
};

okra.server.start = () => {
  okra.server.http.listen(okra.HTTP_PORT, okra.HTTP_HOST);

  if (okra.server.jstp) okra.server.jstp.listen(
    okra.JSTP_PORT, okra.JSTP_HOST
  );

  okra.started = true;
};

okra.server.stop = () => {
  okra.server.http.close();
  if (okra.server.jstp) okra.server.jstp.close();
};

okra.server.restart = () => {
  okra.log.warning('Okra server restarting');
  okra.server.stop();
  okra.server.start();
  okra.log.info('Okra server restarted');
};
