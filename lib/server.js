'use strict';

const onRequest = application => (req, res) => {
  const url = req.url;
  const method = req.method;

  const handlers = application.handlers.api.get(url);

  if (handlers && (method in handlers)) {
    const handler = handlers[method];
    handler(req, res);
  }
};

const application = framework.application;
const server = api.http.createServer(onRequest(application));

framework.server = server;

framework.server.start = () => (
  server.listen(framework.PORT, framework.HOST),
  framework.started = true
);

framework.server.restart = () => {
  api.warning.log('Framework server restarting'),
  framework.server.close();
  framework.server.start();
  api.info.log('Framework server restarted');
};
