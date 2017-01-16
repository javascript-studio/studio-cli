/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const request = require('./request');

const BUILD_STATUS = {
  CREATED: ' ✨  Build created',
  ANALYZING: ' 🔮  Analyzing',
  ERROR: ' 🚨  Error',
  FAILED: ' ⚠️  Failed',
  SUCCESS: ' ✅  Success'
};
const STATUS_TIMEOUTS = {
  CREATED: 10000,
  ANALYZING: 120000
};
const FINAL = {
  ERROR: true,
  FAILED: true,
  SUCCESS: true
};

module.exports = function (config, report_ref, callback) {

  const start = Date.now();
  let last_status = null;
  let delay = 250;

  function load_report() {
    request(config, {
      path: `/uploads/${report_ref}`,
      timeout: 5000,
      expect: 200
    }, null, (err, json) => {
      if (err) {
        callback(err);
        return;
      }

      const status = BUILD_STATUS[json.status];
      if (!status) {
        throw new Error(`Unknown build status "${json.status}"`);
      }

      if (status !== last_status) {
        last_status = status;
        console.log(status);
      }

      if (FINAL[json.status]) {
        callback(null, json);
      } else if (Date.now() - start > STATUS_TIMEOUTS[json.status]) {
        callback(new Error('Timeout'));
      } else {
        delay = Math.max(delay * 2, 2000);
        setTimeout(load_report, delay);
      }
    });
  }

  setTimeout(load_report, delay);
};
