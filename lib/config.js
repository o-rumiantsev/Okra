'use strict';

const fs = require('fs');

const EXTENSION = /\..*/;

framework.config = {};

const currentDir = process.cwd();
const configPath = currentDir + '/config/';

try {
  const files = fs.readdirSync(configPath);

  files.forEach(file => {
    file = file.replace(EXTENSION, '');
    framework.config[file] = require(configPath + file);
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
