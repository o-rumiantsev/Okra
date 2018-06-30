'use strict';

const http = require('http');
const https = require('https');
const tools = require('tools');

const onRequest = app => (req, res) => {
  const url = req.url;

  console.log(api);
  res.end();
};

const boundServer = (app, { port, host }) => http
  .createServer(onRequest(app))
  .listen(port, host);

module.exports = {
  boundServer
};
