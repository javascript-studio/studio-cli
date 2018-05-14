/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Studio = require('../lib/studio');

describe('start', () => {
  let studio;

  beforeEach(() => {
    studio = new Studio({});
    sinon.stub(studio, 'loadConfig');
    sinon.stub(studio, 'readStream');
    sinon.stub(studio.spinner, 'start').returns(studio.spinner);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('starts spinne, loads config and reads stream', () => {
    studio.start();

    sinon.assert.calledOnce(studio.spinner.start);
    sinon.assert.calledOnce(studio.loadConfig);
    sinon.assert.calledOnce(studio.readStream);
    assert.equal(studio.spinner.text, 'Reading input');
  });

});
