/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const request = require('./request');

const BUILD_STATUS = {
  UNKNOWN: ' ⏳  Waiting for build',
  CREATED: ' ✨  Build created',
  LOADING: ' 🔋  Loading sources',
  LOADED: ' 🔋  Loaded sources',
  ANALYZING: ' 🔎  Analyzing',
  ERROR: ' 🚨  Error',
  FAILED: ' ⚠️  Failed',
  SUCCESS: ' ✅  Success'
};
const STATUS_TIMEOUTS = {
  UNKNOWN: 10000,
  CREATED: 10000,
  LOADING: 30000,
  LOADED: 10000,
  ANALYZING: 120000
};
const FINAL = {
  ERROR: true,
  FAILED: true,
  SUCCESS: true
};

module.exports = function (config, project_name, report_ref, callback) {

  const { account, token } = config;
  const start = Date.now();
  let last_status = null;
  let delay = 125;

  function load_report() {
    request(config, {
      path: `/projects/${account}/${project_name}/reports/upload/${report_ref}`,
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'JavaScript Studio CLI'
      },
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
