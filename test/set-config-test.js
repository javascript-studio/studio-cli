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
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sets config to given values merged with defaults', () => {
    state.setConfig({ account: 'mantoni', token: '123-456-789' });

    assert.deepEqual(state.config, {
      account: 'mantoni',
      token: '123-456-789',
      protocol: 'https:',
      hostname: 'api.javascript.studio',
      port: null,
      basepath: '/beta'
    });
  });

  it('fetches upload URL', () => {
    state.setConfig({ account: 'mantoni', token: '123-456-789' });

    sinon.assert.calledOnce(upload.url);
    sinon.assert.calledWith(upload.url, state.config, null, sinon.match.func);
  });

});
