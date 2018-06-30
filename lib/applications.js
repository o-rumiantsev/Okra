'use strict';

const fs = require('fs');

const createApp = directory => {
  fs.readdir(directory, (err, dir) => {
    console.log(dir);
  })
};

createApp('../application')

module.exports = {
  createApp
};
