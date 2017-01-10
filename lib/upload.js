/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const url = require('url');
const zlib = require('zlib');
const tar = require('tar-stream');
const request = require('./request');

module.exports = function (config, project_name, callback) {

  const pack = tar.pack();
  const gzip = pack.pipe(zlib.createGzip());

  request(config, {
    method: 'POST',
    path: '/upload',
    headers: {
      Authorization: `token ${config.token}`,
      'User-Agent': 'JavaScript Studio CLI'
    },
    timeout: 5000,
    expect: 200
  }, {
    name: project_name
  }, (err, json) => {
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

  return pack;
};
