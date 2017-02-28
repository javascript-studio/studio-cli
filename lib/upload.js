/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const url = require('url');
const request = require('./request');

exports.url = function (config, data, callback) {
  request(config, {
    method: 'POST',
    path: '/uploads',
    timeout: 5000,
    expect: [200, 403]
  }, data, (err, json, res) => {
    if (err) {
      callback(err);
      return;
    }
    if (res.statusCode === 403) {
      callback(new Error(json && json.message || 'Forbidden'));
      return;
    }
    callback(null, json);
  });
};

exports.upload = function (upload_url, stream, content_length, callback) {
  const opts = url.parse(upload_url);
  request(opts, {
    method: 'PUT',
    path: opts.path,
    timeout: 30000,
    expect: 200,
    headers: {
      'Content-Length': content_length
    }
  }, stream, callback);
};
