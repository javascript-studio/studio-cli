/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const xtend = require('xtend');
const { http_request, https_request } = require('@studio/json-request');

const PROTOCOLS = {
  'http:': http_request,
  'https:': https_request
};

module.exports = function (config, options, data, callback) {
  const request = PROTOCOLS[config.protocol];
  if (!request) {
    throw new Error(`Unsupported protocol: ${config.protocol}`);
  }
  const opts = xtend({
    hostname: config.hostname,
    port: config.port
  }, options);
  request(opts, data, callback);
};
