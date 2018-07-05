(client, callback) => {
  api.writeHello(client.res);
  const info = `Api: ${!!api};`;
  client.res.write(info);
  api.console.log(api.db);
  callback(null);
}
