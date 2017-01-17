/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const xtend = require('xtend');
const { http_request, https_request } = require('@studio/json-request');
const version = require('../package.json').version;

const PROTOCOLS = {
  'http:': http_request,
  'https:': https_request
};

module.exports = function (config, options, data, callback) {
  const request = PROTOCOLS[config.protocol];
  if (!request) {
    throw new Error(`Unsupported protocol: ${config.protocol}`);
  }
  const opts = xtend(options, {
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
