/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const url = require('url');
const zlib = require('zlib');
const request = require('./request');

module.exports = function (config, data, callback) {

  const gzip = zlib.createGzip();

  request(config, {
    method: 'POST',
    path: '/uploads',
    timeout: 5000,
    expect: 200
  }, data, (err, json) => {
    if (err) {
      callback(err);
      return;
    }

    const opts = url.parse(json.url);
    request(opts, {
      method: 'PUT',
      path: opts.path,
      timeout: 30000,
      expect: 200
    }, gzip, (err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, {
        ref: json.ref
      });
    });

  });

  return gzip;
};
