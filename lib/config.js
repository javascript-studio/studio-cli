/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const fs = require('fs');

exports.home = function () {
  const home_env = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
  return process.env[home_env];
};

exports.read = function (file, callback) {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      callback(null, {});
      return;
    }
    const config = {};
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.match(/^#/)) {
        continue;
      }
      const match = line.match(/^([^=]+)=(.+)$/);
      if (!match) {
        callback(new Error(`Invalid line in config: "${line}"`));
        return;
      }
      config[match[1]] = match[2];
    }
    callback(null, config);
  });
};
