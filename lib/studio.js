/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const convert_source_map = require('convert-source-map');
const ora = require('ora');
const logger = require('@studio/log');
const log_format = require('@studio/log/format/fancy');
const config = require('./config');
const config_builder = require('./config-builder');
const gzip = require('./gzip');
const loadReport = require('./load-report');
const readStream = require('./read-stream');
const renderReport = require('./render-report');
const upload = require('./upload');

const ENC_ALGORITHM = 'aes-128-ctr';

function enableLogger() {
  logger.transform(log_format({ ts: false, ns: false })).out(process.stdout);
}

class Studio {

  constructor(argv) {
    if (argv.debug) {
      enableLogger();
    }
    this.argv = argv;
    this.spinner = ora('');
    this.working_dir = argv.file ? path.dirname(argv.file) : process.cwd();
    this.config = null;
    this.secret = null;
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
    if (!this.config.token) {
      this.fail('Missing .studio or ~/.studio config file or '
        + 'STUDIO_TOKEN environment variable');
      return;
    }
    this.secret = this.config.secret;
    if (this.secret) {
      this.iv = crypto.randomBytes(16);
    }
    if (this.argv.debug) {
      this.spinner.stop();
    }

    // Fetch upload URL:
    const data = {};
    if (this.argv.global) {
      data.global = this.argv.global;
    }
    if (this.secret) {
      data.encryption = ENC_ALGORITHM;
      data.iv = this.iv.toString('hex');
    }
    upload.url(this.config, data, (err, json) => {
      if (err) {
        this.fail('Failed to get upload URL', err);
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
        this.fail('gzip failure', err);
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
    if (this.secret) {
      const key = Buffer.from(this.secret, 'hex');
      const cipher = crypto.createCipheriv(ENC_ALGORITHM, key, this.iv);
      this.gzip_buffer = Buffer.concat([
        cipher.update(this.gzip_buffer),
        cipher.final()
      ]);
    }
    const url = this.upload_json.url;
    const content_length = this.gzip_buffer.length;
    const stream = upload.upload(url, content_length, (err) => {
      if (err) {
        this.fail('Failed to upload file', err);
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
          this.fail('Failed to load report', err);
        } else {
          renderReport(report_json, this.source_map);
        }
      });
  }

  readStream() {
    let stream;
    if (this.argv.file) {
      stream = fs.createReadStream(this.argv.file, 'utf8');
      stream.on('error', (err) => {
        if (err) {
          this.fail(`Failed to read file ${this.argv.file}`, err);
        }
      });
    } else {
      process.stdin.setEncoding('utf8');
      stream = process.stdin;
    }
    readStream(stream, (err, source) => {
      if (err) {
        this.fail('Failed to read source', err);
      } else {
        this.setSource(source);
      }
    });
  }

  loadConfig() {
    const home = config.home();
    const config_file_locations = [
      '.studio',
      path.join(home, '.studio'),
    ];
    const xdg = process.env.XDG_CONFIG_HOME;
    if (xdg) {
      config_file_locations.push(path.join(xdg, 'studio'));
    }
    config_file_locations.push(path.join(home, '.config', 'studio'));
    config_file_locations.push(path.join(home, '.studio', 'config')); // Legacy
    let i = 0;
    const next = () => {
      const config_file = config_file_locations[i++];
      config.read(config_file, (err, values) => {
        if (err) {
          if (err.code === 'ENOENT' || err.code === 'EISDIR') {
            if (i < config_file_locations.length) {
              next();
            } else {
              // Try to use defaults and read token from environment:
              this.setConfig({});
            }
          } else {
            this.fail('Failed to read config', err);
          }
        } else {
          this.setConfig(values);
        }
      });
    };
    next();
  }

}

module.exports = Studio;
