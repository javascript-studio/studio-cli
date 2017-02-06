/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const chalk = require('chalk');
const source_map = require('source-map');

const SPACES = new Array(80).join(' ');

function source(src, loc) {
  const c1 = loc.start.column;
  const c2 = loc.start.line === loc.end.line ? loc.end.column : src.length;
  const pre = src.substring(0, c1);
  const hi = src.substring(c1, c2);
  const post = src.substring(c2);
  return `${pre}${chalk.yellow.underline(hi)}${post}`;
}

function pad_line_number(num) {
  return num < 10 ? `   ${num} ` : (num < 100 ? `  ${num} ` : ` ${num} `);
}

function line_number(pos) {
  return chalk.bgBlack.gray(pad_line_number(pos.line || 0));
}

function section(errs, title, color, source_map_consumer) {
  if (!errs.length) {
    return;
  }
  const heading = `${title}${SPACES.substring(title.length)}`;
  console.log(`\n ${chalk[color](chalk.bold.underline(heading))}\n`);

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
      let pos = err.loc.start;
      if (source_map_consumer) {
        pos = source_map_consumer.originalPositionFor(pos);
      }
      const line = line_number(pos);
      const code = source(err.source, err.loc);
      console.log(chalk[color](`      ${err.name}: ${err.message}`));
      if (code) {
        console.log(`      ${line} ${code}\n`);
      }
      err.occurrences[0].stack.forEach(s => {
        const m = s.match(/:([0-9]+):([0-9]+)$/);
        if (!m) {
          return;
        }
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
      console.log('');
    });
  });
  console.log('');
}

module.exports = function (report, map) {
  const consumer = map ? new source_map.SourceMapConsumer(map) : null;
  section(report.errors.parser, 'Parser Errors', 'red', consumer);
  section(report.errors.runtime, 'Runtime Errors', 'red', consumer);
  if (report.exceptions) {
    section(report.exceptions.thrown, 'Thrown Exceptions', 'magenta', consumer);
  }
};
