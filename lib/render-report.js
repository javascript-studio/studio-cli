/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const chalk = require('chalk');
const source_map = require('source-map');

function source(src, loc) {
  const c1 = loc.start.column;
  const c2 = loc.start.line === loc.end.line ? loc.end.column : c1 + 1;
  const pre = src.substring(0, c1);
  const hi = src.substring(c1, c2);
  const post = src.substring(c2);
  return `${pre}${chalk.yellow.underline(hi)}${post}`;
}

function pad_line_number(num) {
  return num < 10 ? `   ${num} ` : (num < 100 ? `  ${num} ` : ` ${num} `);
}

function line_number(loc) {
  return chalk.bgBlack.gray(pad_line_number(loc.start.line));
}

function runtime_errors(errs, project_name, color, source_map_consumer) {
  const errs_by_file = [];
  const errs_index = {};
  for (let i = 0, l = errs.length; i < l; i++) {
    const e = errs[i];
    if (source_map_consumer) {
      const mapped = source_map_consumer.originalPositionFor(e.loc.start);
      e.file = mapped.source || '[unknown]';
    } else {
      e.file = '[stdin]';
    }
    if (errs_index.hasOwnProperty(e.file)) {
      errs_by_file[errs_index[e.file]].errs.push(e);
    } else {
      errs_index[e.file] = errs_by_file.length;
      errs_by_file.push({
        file: e.file,
        errs: [e]
      });
    }
  }
  errs_by_file.forEach(err => {
    console.log(`\n 📄  ${err.file}\n\n`);
    err.errs.forEach(err => {
      const line = line_number(err.loc);
      const code = source(err.source, err.loc);
      console.log(chalk[color](`      ${err.name}: ${err.message}`));
      console.log(`      ${line} ${code}\n`);
      err.occurrences[0].stack.forEach(s => {
        const m = s.match(/:([0-9]+):([0-9]+)$/);
        if (source_map_consumer) {
          const mapped = source_map_consumer.originalPositionFor({
            line: Number(m[1]),
            column: Number(m[2])
          });
          if (mapped.source
              && mapped.source.indexOf('node_modules/browser-pack/') === -1) {
            console.log(`         at ${mapped.source}:${mapped.line}:${m[2]}`);
          }
        } else {
          console.log(`         at [stdin]:${m[1]}:${m[2]}`);
        }
      });
    });
  });
}

const SPACES = new Array(80).join(' ');

function heading(str) {
  return chalk.bold.underline(`${str}${SPACES.substring(str.length)}`);
}

module.exports = function (project_name, ref, report_json, map) {
  const err_runtime = report_json.err.filter(e =>
    e.status === 'THROWN_BY_RUNTIME' || e.status === 'THROWN_BY_MODULE');
  const err_thrown = report_json.err.filter(e =>
    e.status === 'THROWN_BY_CODE' || e.status === 'RETHROWN_BY_CODE');

  const consumer = map ? new source_map.SourceMapConsumer(map) : null;
  if (err_runtime.length) {
    console.log(`\n ${chalk.red(heading('Errors'))}\n`);
    runtime_errors(err_runtime, project_name, 'red', consumer);
    console.log('');
  }
  if (err_thrown.length) {
    console.log(`\n ${chalk.magenta(heading('Exceptions'))}\n`);
    runtime_errors(err_thrown, project_name, 'magenta', consumer);
    console.log('');
  }
};
