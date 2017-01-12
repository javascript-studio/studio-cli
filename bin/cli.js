#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const path = require('path');
const url = require('url');
const minimist = require('minimist');
const convert_source_map = require('convert-source-map');
const studio_config = require('../lib/config');
const upload = require('../lib/upload');
const load_report = require('../lib/load-report');
const render_report = require('../lib/render-report');

const argv = minimist(process.argv.slice(2));
let gzip = null;
let stream_end = false;
let source = '';
let source_map;

function upload_source() {
  source_map = convert_source_map.fromSource(source);
  if (source_map) {
    source_map = source_map.toObject();
    source = convert_source_map.removeComments(source);
  }
  gzip.write(source);
  gzip.end();
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  source += chunk;
});
process.stdin.on('end', () => {
  stream_end = true;
  if (gzip) {
    upload_source();
  }
});

const config_file = path.join(studio_config.home(), '.studio', 'config');

studio_config.read(config_file, (err, values) => {
  if (err) {
    console.error(` 🚨  ${err.message}`);
    process.exitCode = 1;
    return;
  }
  const api = values.api || 'https://api.javascript.studio';
  const api_url = url.parse(api);

  const config = {
    protocol: api_url.protocol,
    hostname: api_url.hostname,
    port: api_url.port,
    account: values.account,
    token: values.token
  };

  let data = null;
  if (argv.global) {
    data = {
      global: argv.global
    };
  }
  gzip = upload(config, data, (err, upload_json) => {
    if (err) {
      throw err;
    }
    load_report(config, upload_json.ref, (err, report_json) => {
      if (err) {
        throw err;
      }
      render_report(upload_json.ref, report_json, source_map);
    });
  });
  if (stream_end) {
    upload_source();
  }
});
