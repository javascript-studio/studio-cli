#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');
const PassThrough = require('stream').PassThrough;
const minimist = require('minimist');
const ora = require('ora');
const convert_source_map = require('convert-source-map');
const logger = require('@studio/log');
const log_format = require('@studio/log/format/fancy');
const studio_config = require('../lib/config');
const upload = require('../lib/upload');
const load_report = require('../lib/load-report');
const render_report = require('../lib/render-report');

function enableLogger() {
  logger.transform(log_format({ ts: false, ns: false })).out(process.stdout);
}

const argv = minimist(process.argv.slice(2), {
  alias: {
    file: 'f',
    global: 'g',
    help: 'h',
    version: 'v',
    exceptions: 'e'
  }
});

if (argv.help) {
  const help_file = path.join(__dirname, 'help.txt');
  fs.createReadStream(help_file, 'utf8').pipe(process.stdout);
  return;
}
if (argv.version) {
  const pkg = require('../package.json');
  console.log(`${pkg.name} version ${pkg.version}`);
  return;
}
if (argv.debug) {
  enableLogger();
}

let stream_end = false;
let config = null;
let url_json = null;
let gzip_buffer = null;
let source_map;

console.log('');
const spinner = ora('').start();

function fail(message, error) {
  spinner.stop();
  if (!argv.debug) {
    enableLogger();
  }
  logger('cli').error(message, {}, error);
  process.exitCode = 1;
}

function uploadGzip() {
  if (argv.debug) {
    spinner.stop();
  } else {
    spinner.text = 'Uploading';
  }
  const stream = new PassThrough();
  upload.upload(url_json.url, stream, gzip_buffer.length, (err) => {
    if (err) {
      fail('Failed to upload file', err.message);
      return;
    }
    load_report(config, url_json.number, argv, spinner, (err, report_json) => {
      if (err) {
        fail('Failed to load report', err.message);
        return;
      }
      render_report(report_json, source_map);
    });
  });
  stream.write(gzip_buffer);
  stream.end();
}

function readStream(stream) {
  let source = '';
  stream.on('data', (chunk) => {
    source += chunk;
  });
  stream.on('end', () => {
    if (!source) {
      fail('No sources received on stdin');
      return;
    }
    source_map = convert_source_map.fromSource(source);
    if (source_map) {
      source_map = source_map.toObject();
      source = convert_source_map.removeComments(source);
    }
    const gzip = zlib.createGzip();
    const chunks = [];
    gzip.on('data', (chunk) => {
      chunks.push(chunk);
    });
    gzip.on('end', () => {
      gzip_buffer = Buffer.concat(chunks);
      stream_end = true;
      if (url_json) {
        uploadGzip();
      } else {
        spinner.text = 'Pending upload';
      }
    });
    gzip.write(source);
    gzip.end();
  });
}

spinner.text = 'Reading input';
if (argv.file) {
  const stream = fs.createReadStream(argv.file, 'utf8');
  stream.on('error', (err) => {
    if (err) {
      fail(`Failed to read file ${argv.file}`, err.message);
      return;
    }
  });
  readStream(stream);
} else {
  process.stdin.setEncoding('utf8');
  readStream(process.stdin);
}

const config_file = path.join(studio_config.home(), '.studio', 'config');

studio_config.read(config_file, (err, values) => {
  if (err) {
    fail('Failed to read config', err.message);
    return;
  }
  const api = values.api || 'https://api.javascript.studio/beta';
  const api_url = url.parse(api);

  config = {
    protocol: api_url.protocol,
    hostname: api_url.hostname,
    basepath: api_url.path === '/' ? '' : api_url.path,
    port: api_url.port,
    account: values.account,
    token: values.token
  };

  if (argv.debug) {
    spinner.stop();
  }

  let data = null;
  if (argv.global) {
    data = {
      global: argv.global
    };
  }
  upload.url(config, data, (err, json) => {
    if (err) {
      fail('Failed to get upload URL', err.message);
      return;
    }
    url_json = json;
    if (stream_end) {
      uploadGzip();
    } else if (argv.debug) {
      spinner.start().text = 'Reading input';
    }
  });
});
