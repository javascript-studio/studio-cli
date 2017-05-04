/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const State = require('../lib/state');

describe('start', () => {
  let sandbox;
  let state;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    state = new State({});
    sandbox.stub(state, 'loadConfig');
    sandbox.stub(state, 'readStream');
    sandbox.stub(state.spinner, 'start').returns(state.spinner);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('starts spinne, loads config and reads stream', () => {
    state.start();

    sinon.assert.calledOnce(state.spinner.start);
    sinon.assert.calledOnce(state.loadConfig);
    sinon.assert.calledOnce(state.readStream);
    assert.equal(state.spinner.text, 'Reading input');
  });

});
