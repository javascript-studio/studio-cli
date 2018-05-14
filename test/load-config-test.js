/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const sinon = require('sinon');
const config = require('../lib/config');
const Studio = require('../lib/studio');

const ENOENT = new Error('ENOENT');
ENOENT.code = 'ENOENT';
const EISDIR = new Error('EISDIR');
EISDIR.code = 'EISDIR';

describe('load-config', () => {
  let state;

  beforeEach(() => {
    sinon.stub(fs, 'readFile');
    sinon.stub(config, 'home').returns('~');
    state = new Studio({});
    sinon.stub(state, 'fail');
    sinon.stub(state, 'setConfig');
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.XDG_CONFIG_HOME;
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

  it('loads config from XDG_CONFIG_HOME', () => {
    process.env.XDG_CONFIG_HOME = '~/.xdg';
    fs.readFile.withArgs('.studio').yields(ENOENT);
    fs.readFile.withArgs('~/.studio').yields(ENOENT);
    state.loadConfig();

    sinon.assert.calledThrice(fs.readFile);
    sinon.assert.calledWith(fs.readFile, '~/.xdg/studio');
  });

  it('loads config from .config/studio', () => {
    fs.readFile.withArgs('.studio').yields(ENOENT);
    fs.readFile.withArgs('~/.studio').yields(ENOENT);
    state.loadConfig();

    sinon.assert.calledThrice(fs.readFile);
    sinon.assert.calledWith(fs.readFile, '~/.config/studio');
  });

  it('loads config from ~/.studio/config', () => {
    fs.readFile.withArgs('.studio').yields(EISDIR);
    fs.readFile.withArgs('~/.studio').yields(ENOENT);
    fs.readFile.withArgs('~/.config/studio').yields(ENOENT);
    state.loadConfig();

    sinon.assert.callCount(fs.readFile, 4);
    sinon.assert.calledWith(fs.readFile, '~/.studio/config');
  });

  it('fails if reading the config file fails', () => {
    fs.readFile.yields(new Error('Hell no'));

    state.loadConfig();

    sinon.assert.calledOnce(state.fail);
    sinon.assert.calledWith(state.fail, 'Failed to read config');
  });

  it('set config to empty object if none of the file locations exists', () => {
    fs.readFile.yields(ENOENT);

    state.loadConfig();

    sinon.assert.calledOnce(state.setConfig);
    sinon.assert.calledWith(state.setConfig, {});
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
