#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const Studio = require('../lib/studio');

const argv = minimist(process.argv.slice(2), {
  boolean: ['exceptions'],
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

console.log('');

new Studio(argv).start();
