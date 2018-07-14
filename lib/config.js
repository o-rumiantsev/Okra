'use strict';

const fs = require('fs');

const EXTENSION = /\..*/;

okra.config = {};

const currentDir = process.cwd();
const configPath = currentDir + '/config/';

try {
  const files = fs.readdirSync(configPath);

  files.forEach(file => {
    file = file.replace(EXTENSION, '');
    okra.config[file] = require(configPath + file);
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
