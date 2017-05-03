/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const xtend = require('xtend');
const request = require('@studio/json-request');
const version = require('../package.json').version;

module.exports = function (config, options, data, callback) {
  const opts = xtend(options, {
    protocol: config.protocol,
    hostname: config.hostname,
    port: config.port
  });
  if (config.basepath) {
    opts.path = `${config.basepath}${opts.path}`;
  }
  if (!opts.headers) {
    opts.headers = {};
  }
  opts.headers['User-Agent'] = `JavaScript Studio CLI v${version}`;
  if (config.token) {
    opts.headers.Authorization = `token ${config.token}`;
  }
  request(opts, data, callback);
};
