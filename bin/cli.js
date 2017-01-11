#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const path = require('path');
const url = require('url');
const minimist = require('minimist');
const studio_config = require('../lib/config');
const upload = require('../lib/upload');
const load_report = require('../lib/load-report');
const render_report = require('../lib/render-report');

const argv = minimist(process.argv.slice(2));
const project_name = argv.project;

let stream;
if (argv._.length) {
  const browserify = require('browserify');
  stream = browserify(argv._, {
    builtins: false,
    commondir: false,
    detectGlobals: false,
    standalone: 'studio_main'
  }).bundle();
} else {
  process.stdin.setEncoding('utf8');
  stream = process.stdin;
}

if (!project_name) {
  console.error(' 🚨  Missing `--project`');
  process.exitCode = 1;
  return;
}

let pack = null;
let stream_end = false;
let source = '';

function pack_source() {
  pack.entry({ name: 'index.js' }, source);
  pack.finalize();
}

stream.on('data', (chunk) => {
  source += chunk;
});
stream.on('end', () => {
  stream_end = true;
  if (pack) {
    pack_source();
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

  pack = upload(config, project_name, (err, upload_json) => {
    if (err) {
      throw err;
    }
    load_report(config, project_name, upload_json.ref, (err, report_json) => {
      if (err) {
        throw err;
      }
      render_report(project_name, report_json);
    });
  });
  if (stream_end) {
    pack_source();
  }
});
