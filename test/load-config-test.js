/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const sinon = require('sinon');
const config = require('../lib/config');
const State = require('../lib/state');

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

  it('loads config from ~/.studio/config', () => {
    state.loadConfig();

    sinon.assert.calledOnce(fs.readFile);
    sinon.assert.calledWith(fs.readFile, '~/.studio/config');
  });

  it('fails if reading the config file fails', () => {
    fs.readFile.yields(new Error('Hell no'));

    state.loadConfig();

    sinon.assert.calledOnce(state.fail);
    sinon.assert.calledWith(state.fail, 'Failed to read config');
  });

  it('sets config if read succeeds', () => {
    fs.readFile.yields(null, '# Config\ntoken=123-456-789');

    state.loadConfig();

    sinon.assert.calledOnce(state.setConfig);
    sinon.assert.calledWith(state.setConfig, {
      token: '123-456-789'
    });
  });

});
