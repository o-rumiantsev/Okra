(req, res) => {
  api.writeHello(res);
  const info = `Api: ${!!api};`;
  res.write(info);
  api.console.log(api.db);
  res.end();
}
