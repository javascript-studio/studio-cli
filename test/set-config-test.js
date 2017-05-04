/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const upload = require('../lib/upload');
const State = require('../lib/state');

describe('set-config', () => {
  let sandbox;
  let state;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    state = new State({});
    sandbox.stub(upload, 'url');
    sandbox.stub(state, 'fail');
    sandbox.stub(state, 'setUpload');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sets config to given values merged with defaults', () => {
    state.setConfig({ token: '123-456-789' });

    assert.deepEqual(state.config, {
      token: '123-456-789',
      protocol: 'https:',
      hostname: 'api.javascript.studio',
      port: null,
      basepath: '/beta'
    });
  });

  it('fetches upload URL', () => {
    state.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(upload.url);
    sinon.assert.calledWith(upload.url, state.config, null, sinon.match.func);
  });

  it('fails if fetching the upload URL errs', () => {
    upload.url.yields(new Error('No'));

    state.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(state.fail);
    sinon.assert.calledWith(state.fail, 'Failed to get upload URL');
  });

  it('calls setUpload if fetching the upload URL succeeds', () => {
    upload.url.yields(null, {
      url: 'http://localhost:9000/uploads',
      number: 42
    });

    state.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(state.setUpload);
    sinon.assert.calledWith(state.setUpload, {
      url: 'http://localhost:9000/uploads',
      number: 42
    });
  });

});
