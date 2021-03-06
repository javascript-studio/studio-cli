/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const url = require('url');

exports.build = function (values) {
  const api = values.api || 'https://api.javascript.studio/beta';
  const api_url = url.parse(api);

  return {
    protocol: api_url.protocol,
    hostname: api_url.hostname,
    basepath: api_url.path === '/' ? '' : api_url.path,
    port: api_url.port,
    token: process.env.STUDIO_TOKEN || values.token || null,
    secret: process.env.STUDIO_SECRET || values.secret || null
  };
};
