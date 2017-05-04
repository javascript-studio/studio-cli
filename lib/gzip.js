/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const zlib = require('zlib');

module.exports = function (data, callback) {
  const gzip = zlib.createGzip();
  const chunks = [];
  gzip.on('data', (chunk) => {
    chunks.push(chunk);
  });
  gzip.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });
  gzip.write(data);
  gzip.end();
};
