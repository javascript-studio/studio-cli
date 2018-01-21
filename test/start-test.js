/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Studio = require('../lib/studio');

describe('start', () => {
  let sandbox;
  let studio;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    studio = new Studio({});
    sandbox.stub(studio, 'loadConfig');
    sandbox.stub(studio, 'readStream');
    sandbox.stub(studio.spinner, 'start').returns(studio.spinner);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('starts spinne, loads config and reads stream', () => {
    studio.start();

    sinon.assert.calledOnce(studio.spinner.start);
    sinon.assert.calledOnce(studio.loadConfig);
    sinon.assert.calledOnce(studio.readStream);
    assert.equal(studio.spinner.text, 'Reading input');
  });

});
