(req, res) => {
  api.writeHello(res);
  const info = `Application: ${!!application};\n` +
    `Api: ${!!api};`;
  res.write(info);
  api.console.log(api.db);
  res.end();
}
