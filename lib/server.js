'use strict';

const http = require('http');
const https = require('https');
const tools = require('common-toolkit');

const onRequest = app => (req, res) => {
  const url = req.url;
  const method = req.method;

  const handlers = app.api.get(url);

  if (handlers && (method in handlers)) {
    const handler = handlers[method];
    handler(req, res);
  }
};

const boundServer = (app, { port, host }) => http
  .createServer(onRequest(app))
  .listen(port, host);

module.exports = {
  boundServer
};
