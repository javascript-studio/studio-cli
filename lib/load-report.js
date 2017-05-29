/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const request = require('./request');

const BUILD_STATUS = {
  CREATED: 'Build pending',
  ANALYZING: 'Analyzing',
  ERROR: 'Build error',
  FAILED: 'Build completed with issues',
  SUCCESS: 'Build completed. No issues found.'
};
const STATUS_TIMEOUTS = {
  CREATED: 35000,
  ANALYZING: 35000
};
const FINAL = {
  ERROR: true,
  FAILED: true,
  SUCCESS: true
};
const SYMBOLS = {
  ERROR: '🚨 ',
  FAILED: '⚠️ ',
  SUCCESS: '✅ '
};

module.exports = function (config, report_number, argv, spinner, callback) {

  const start = Date.now();
  let delay = 250;
  let path = `/uploads/${report_number}`;
  if (argv.exceptions) {
    path += '?exceptions=1';
  }

  function load_report() {
    request(config, {
      path,
      timeout: 5000,
      expect: 200
    }, null, (err, json) => {
      if (err) {
        callback(err);
        return;
      }

      let status = BUILD_STATUS[json.status];
      if (!status) {
        callback(new Error(`Unknown build status "${json.status}"`));
        return;
      }

      if (json.message) {
        status = `${status} - ${json.message}`;
      }
      spinner.text = status;

      if (FINAL[json.status]) {
        spinner.stopAndPersist({
          symbol: SYMBOLS[json.status]
        });
        callback(null, json);
      } else if (Date.now() - start > STATUS_TIMEOUTS[json.status]) {
        callback(new Error('Timeout'));
      } else {
        delay = Math.min(delay * 2, 4000);
        setTimeout(load_report, delay);
      }
    });
  }

  setTimeout(load_report, delay);
};
