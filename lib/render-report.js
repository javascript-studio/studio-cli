/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const chalk = require('chalk');

function module_file(file, project_name) {
  const parts = file.split(':');
  const mod = parts[0].split('@');
  return mod[0] === project_name ? parts[1] : `${parts[0]} ${parts[1]}`;
}

function source(src, loc) {
  const c1 = loc.start.column;
  const c2 = loc.start.line === loc.end.line ? loc.end.column : c1 + 1;
  const pre = src.substring(0, c1);
  const hi = src.substring(c1, c2);
  const post = src.substring(c2);
  return `${pre}${chalk.yellow.underline(hi)}${post}`;
}

function pad_line_number(num) {
  if (num < 10) {
    return `   ${num} `;
  }
  if (num < 100) {
    return `  ${num} `;
  }
  return ` ${num} `;
}

function line_number(loc) {
  return chalk.bgBlack.gray(pad_line_number(loc.start.line));
}

function runtime_errors(errs, project_name, color) {
  const errs_by_file = [];
  const errs_index = {};
  for (let i = 0, l = errs.length; i < l; i++) {
    const e = errs[i];
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
    const file = module_file(err.file, project_name);
    console.log(`\n 📄  ${file}\n\n`);
    err.errs.forEach(err => {
      const line = line_number(err.loc);
      const code = source(err.source, err.loc);
      console.log(chalk[color](`      ${err.name}: ${err.message}`));
      console.log(`      ${line} ${code}\n`);
      err.occurrences[0].stack.forEach(s => {
        console.log(`         ${s.replace(/:/, ' ')}`);
      });
    });
  });
}

const SPACES = new Array(80).join(' ');

function heading(str) {
  return chalk.bold.underline(`${str}${SPACES.substring(str.length)}`);
}

module.exports = function (project_name, report_json) {
  const err_runtime = report_json.err.filter(e =>
    e.status === 'THROWN_BY_RUNTIME' || e.status === 'THROWN_BY_MODULE');
  const err_thrown = report_json.err.filter(e =>
    e.status === 'THROWN_BY_CODE' || e.status === 'RETHROWN_BY_CODE');

  if (err_runtime.length) {
    console.log(`\n ${chalk.red(heading('Errors'))}\n`);
    runtime_errors(err_runtime, project_name, 'red');
    console.log('');
  }
  if (err_thrown.length) {
    console.log(`\n ${chalk.magenta(heading('Exceptions'))}\n`);
    runtime_errors(err_thrown, project_name, 'magenta');
    console.log('');
  }
};
