#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const path = require('path');
const url = require('url');
const zlib = require('zlib');
const { PassThrough } = require('stream');
const minimist = require('minimist');
const convert_source_map = require('convert-source-map');
const studio_config = require('../lib/config');
const upload = require('../lib/upload');
const load_report = require('../lib/load-report');
const render_report = require('../lib/render-report');

const argv = minimist(process.argv.slice(2));
const stream = new PassThrough();
stream.pause();
let stream_end = false;
let config = null;
let url_json = null;
let content_length = 0;
let source = '';
let source_map;

function fail(message) {
  console.error(` 🚨  ${message}`);
  process.exitCode = 1;
}

function upload_gzip() {
  upload.upload(url_json.url, stream, content_length, (err) => {
    if (err) {
      fail(`Failed to upload file: ${err.message}`);
      return;
    }
    load_report(config, url_json.ref, (err, report_json) => {
      if (err) {
        fail(`Failed to load report: ${err.message}`);
        return;
      }
      render_report(url_json.ref, report_json, source_map);
    });
  });
  stream.resume();
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  source += chunk;
});
process.stdin.on('end', () => {
  source_map = convert_source_map.fromSource(source);
  if (source_map) {
    source_map = source_map.toObject();
    source = convert_source_map.removeComments(source);
  }
  const gzip = zlib.createGzip();
  gzip.pipe(stream);
  gzip.on('data', (chunk) => {
    content_length += chunk.length;
  });
  gzip.on('end', () => {
    stream_end = true;
    if (url_json) {
      upload_gzip();
    }
  });
  gzip.write(source);
  gzip.end();
});

const config_file = path.join(studio_config.home(), '.studio', 'config');

studio_config.read(config_file, (err, values) => {
  if (err) {
    fail(`Failed to read config: ${err.message}`);
    return;
  }
  const api = values.api || 'https://api.javascript.studio/beta';
  const api_url = url.parse(api);

  config = {
    protocol: api_url.protocol,
    hostname: api_url.hostname,
    basepath: api_url.path,
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
  upload.url(config, data, (err, json) => {
    if (err) {
      fail(`Failed to get upload URL: ${err.message}`);
      return;
    }
    url_json = json;
    if (stream_end) {
      upload_gzip();
    }
  });
});
