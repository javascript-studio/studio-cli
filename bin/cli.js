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
if (!project_name) {
  console.error(' 🚨  Missing `--project`');
  process.exitCode = 1;
  return;
}

process.stdin.setEncoding('utf8');
process.stdin.pause();

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

  const pack = upload(config, project_name, (err, upload_json) => {
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

  let source = '';
  process.stdin.on('data', (chunk) => {
    source += chunk;
  });
  process.stdin.on('end', () => {
    pack.entry({ name: 'index.js' }, source);
    pack.finalize();
  });
  process.stdin.resume();
});
