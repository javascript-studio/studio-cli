/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

module.exports = function (stream, callback) {
  let data = '';
  stream.on('data', (chunk) => {
    data += chunk;
  });
  stream.on('end', () => {
    callback(null, data);
  });
};
