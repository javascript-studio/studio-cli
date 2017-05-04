/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const sinon = require('sinon');
const config = require('../lib/config');
const State = require('../lib/state');

const ENOENT = new Error('ENOENT');
ENOENT.code = 'ENOENT';
const EISDIR = new Error('EISDIR');
EISDIR.code = 'EISDIR';

describe('load-config', () => {
  let sandbox;
  let state;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(fs, 'readFile');
    sandbox.stub(config, 'home').returns('~');
    state = new State({});
    sandbox.stub(state, 'fail');
    sandbox.stub(state, 'setConfig');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('loads config from .studio', () => {
    state.loadConfig();

    sinon.assert.calledOnce(fs.readFile);
    sinon.assert.calledWith(fs.readFile, '.studio');
  });

  it('loads config from ~/.studio', () => {
    fs.readFile.withArgs('.studio').yields(ENOENT);
    state.loadConfig();

    sinon.assert.calledTwice(fs.readFile);
    sinon.assert.calledWith(fs.readFile, '~/.studio');
  });

  it('loads config from ~/.studio/config', () => {
    fs.readFile.withArgs('.studio').yields(EISDIR);
    fs.readFile.withArgs('~/.studio').yields(ENOENT);
    state.loadConfig();

    sinon.assert.calledThrice(fs.readFile);
    sinon.assert.calledWith(fs.readFile, '~/.studio/config');
  });

  it('fails if reading the config file fails', () => {
    fs.readFile.yields(new Error('Hell no'));

    state.loadConfig();

    sinon.assert.calledOnce(state.fail);
    sinon.assert.calledWith(state.fail, 'Failed to read config');
  });

  it('fails if none of the file locations exists', () => {
    fs.readFile.yields(ENOENT);

    state.loadConfig();

    sinon.assert.calledOnce(state.fail);
    sinon.assert.calledWith(state.fail,
      'Missing .studio or ~/.studio config file', 'ENOENT');
  });

  it('sets config if .studio read succeeds', () => {
    fs.readFile.withArgs('.studio')
      .yields(null, '# Config\ntoken=123-456-789');

    state.loadConfig();

    sinon.assert.calledOnce(state.setConfig);
    sinon.assert.calledWith(state.setConfig, {
      token: '123-456-789'
    });
  });

  it('sets config if ~/.studio read succeeds', () => {
    fs.readFile.withArgs('.studio').yields(ENOENT);
    fs.readFile.withArgs('~/.studio')
      .yields(null, '# Config\ntoken=123-456-789');

    state.loadConfig();

    sinon.assert.calledOnce(state.setConfig);
    sinon.assert.calledWith(state.setConfig, {
      token: '123-456-789'
    });
  });

});
