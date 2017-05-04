/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const PassThrough = require('stream').PassThrough;
const convert_source_map = require('convert-source-map');
const ora = require('ora');
const logger = require('@studio/log');
const log_format = require('@studio/log/format/fancy');
const config = require('../lib/config');
const config_builder = require('../lib/config-builder');
const gzip = require('./gzip');
const loadReport = require('../lib/load-report');
const readStream = require('../lib/read-stream');
const renderReport = require('../lib/render-report');
const upload = require('../lib/upload');

function enableLogger() {
  logger.transform(log_format({ ts: false, ns: false })).out(process.stdout);
}

class State {

  constructor(argv) {
    if (argv.debug) {
      enableLogger();
    }
    this.argv = argv;
    this.spinner = ora('');
    this.working_dir = argv.file ? path.dirname(argv.file) : process.cwd();
    this.config = null;
    this.upload_json = null;
    this.source = null;
    this.source_map = null;
    this.gzip_buffer = null;
  }

  start() {
    this.spinner.start().text = 'Reading input';
    this.readStream();
    this.loadConfig();
  }

  fail(message, error) {
    this.spinner.stop();
    if (!this.argv.debug) {
      enableLogger();
    }
    logger('cli').error(message, {}, error);
    process.exitCode = 1;
  }

  setConfig(values) {
    this.config = config_builder.build(values);
    if (this.argv.debug) {
      this.spinner.stop();
    }

    // Fetch upload URL:
    let data = null;
    if (this.argv.global) {
      data = {
        global: this.argv.global
      };
    }
    upload.url(this.config, data, (err, json) => {
      if (err) {
        this.fail('Failed to get upload URL', err.message);
      } else {
        this.setUpload(json);
      }
    });
  }

  setUpload(json) {
    this.upload_json = json;
    if (this.gzip_buffer) {
      this.uploadGzip();
    } else if (this.argv.debug) {
      this.spinner.start().text = 'Reading input';
    }
  }

  setSource(source) {
    if (!source) {
      this.fail('No sources received on stdin');
      return;
    }
    this.source = source;
    this.source_map = convert_source_map.fromSource(source);
    if (!this.source_map) {
      try {
        this.source_map = convert_source_map.fromMapFileComment(source,
          this.working_dir);
      } catch (ignore) {
        // It throws if there are no source maps
      }
    }
    if (this.source_map) {
      this.source_map = this.source_map.toObject();
      this.source = convert_source_map.removeComments(source);
    }
    gzip(source, (err, buffer) => {
      if (err) {
        this.fail(String(err));
      } else {
        this.setGzipBuffer(buffer);
      }
    });
  }

  setGzipBuffer(gzip_buffer) {
    this.gzip_buffer = gzip_buffer;
    if (this.upload_json) {
      this.uploadGzip();
    } else {
      this.spinner.text = 'Pending upload';
    }
  }

  uploadGzip() {
    if (this.argv.debug) {
      this.spinner.stop();
    } else {
      this.spinner.text = 'Uploading';
    }
    const stream = new PassThrough();
    const content_length = this.gzip_buffer.length;
    upload.upload(this.upload_json.url, stream, content_length, (err) => {
      if (err) {
        this.fail('Failed to upload file', err.message);
      } else {
        this.loadReport();
      }
    });
    stream.write(this.gzip_buffer);
    stream.end();
  }

  loadReport() {
    loadReport(this.config, this.upload_json.number, this.argv, this.spinner,
      (err, report_json) => {
        if (err) {
          this.fail('Failed to load report', err.message);
        } else {
          renderReport(report_json, this.source_map);
        }
      });
  }

  readStream() {
    const handleSource = (err, source) => {
      if (err) {
        this.fail(String(err));
      } else {
        this.setSource(source);
      }
    };
    if (this.argv.file) {
      const stream = fs.createReadStream(this.argv.file, 'utf8');
      stream.on('error', (err) => {
        if (err) {
          this.fail(`Failed to read file ${this.argv.file}`, err.message);
        }
      });
      readStream(stream, handleSource);
    } else {
      process.stdin.setEncoding('utf8');
      readStream(process.stdin, handleSource);
    }
  }

  loadConfig() {
    const config_file = path.join(config.home(), '.studio', 'config');

    config.read(config_file, (err, values) => {
      if (err) {
        this.fail('Failed to read config', err.message);
      } else {
        this.setConfig(values);
      }
    });
  }

}

module.exports = State;
