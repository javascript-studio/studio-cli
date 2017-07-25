/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const chalk = require('chalk');
const source_map = require('source-map');

const SPACES = new Array(80).join(' ');
const at = chalk.gray('at');

function highlight_source(src, loc) {
  const c1 = loc.start.column;
  let c2 = loc.start.line === loc.end.line ? loc.end.column : src.length;
  if (c1 >= c2) {
    c2 = c1 + 1;
  }
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
  console.log(`\n${chalk[color](chalk.bold.underline(heading))}\n`);

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
    console.log(`\n📄  ${err.file}\n\n`);
    err.errs.forEach(err => {
      let source = err.source;
      let loc = err.loc;
      if (source_map_consumer) {
        const start = source_map_consumer.originalPositionFor(loc.start);
        if (start.source) {
          const src = source_map_consumer.sourceContentFor(start.source, true);
          if (src) {
            source = src.split('\n')[start.line - 1];
            const end = loc.end.line
              ? source_map_consumer.originalPositionFor(loc.end)
              : { line: start.line, column: start.column + 1 };
            if (start.column === 0 && end.column === 0) {
              start.column = loc.start.column;
              end.column = loc.end.column;
            }
            loc = { start, end };
          }
        }
      }
      const line = line_number(loc.start);
      const code = highlight_source(source, loc).trim();
      console.log(chalk[color](`   ${err.name}: ${err.message}`));
      if (code) {
        console.log(`   ${line} ${code}\n`);
      }
      const occurrence = err.occurrences[0];
      occurrence.stack.forEach(s => {
        let m = s.match(/:([0-9]+):([0-9]+)$/);
        let line = null;
        let column = null;
        let name = null;
        let file_loc = null;
        if (m) {
          line = m[1];
          column = m[2];
        } else {
          m = s.match(/at (.+) \(.+:([0-9]+):([0-9]+)\)$/);
          if (!m) {
            const p = s.indexOf('at ');
            if (p === 0) {
              s = `${at} ${s.substring(p + 3)}`;
            }
            console.log(`         ${s}`);
            return;
          }
          name = m[1];
          line = m[2];
          column = m[3];
        }
        if (source_map_consumer) {
          const mapped = source_map_consumer.originalPositionFor({
            line: Number(line),
            column: Number(column)
          });
          if (mapped.source
              && mapped.source.indexOf('node_modules/browser-pack/') === -1) {
            file_loc = `${mapped.source}:${mapped.line}:${column}`;
          }
        } else {
          file_loc = `[stdin]:${line}:${column}`;
        }
        if (file_loc && name) {
          console.log(`         ${at} ${name} ${chalk.gray(`(${file_loc})`)}`);
        } else if (file_loc) {
          console.log(`         ${at} ${chalk.gray(file_loc)}`);
        } else if (name) {
          console.log(`         ${at} ${name}`);
        }
      });
      console.log('');
      const values = occurrence.values;
      if (values) {
        const max_length = Object.keys(values)
          .reduce((max, key) => Math.max(max, key.length), 0);
        const spaces = new Array(max_length + 1).join(' ');
        Object.keys(values).forEach((key) => {
          const blank = spaces.substring(key.length);
          const value = chalk.cyan(values[key]);
          console.log(`         ${chalk.gray(`${key}:`)} ${blank} ${value}`);
        });
        console.log('');
      }
      console.log('\n');
    });
  });
  console.log('');
}

function stats(report) {
  const nodes = report.evaluated_nodes;
  const percent = Math.round(nodes * 100 / report.total_nodes);
  const seconds = (report.duration / 1000).toFixed(1);
  console.log('');
  console.log(`${chalk.gray('Build Duration:')}  ${seconds}s`);
  if (nodes) {
    console.log(`${chalk.gray('Nodes Analyzed:')}  ${nodes} = ${percent}%`);
  }
  if (report.api_functions) {
    console.log(`${chalk.gray('API Functions:')}   ${report.api_functions}`);
  }
  console.log('');
}

module.exports = function (report, map) {
  stats(report);
  const consumer = map ? new source_map.SourceMapConsumer(map) : null;
  if (report.errors) {
    section(report.errors.parser, 'Parser Errors', 'red', consumer);
    section(report.errors.runtime, 'Runtime Errors', 'red', consumer);
    process.exitCode = 64;
  }
  if (report.exceptions) {
    section(report.exceptions.thrown, 'Thrown Exceptions', 'magenta', consumer);
  }
};
