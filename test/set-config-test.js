/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const upload = require('../lib/upload');
const Studio = require('../lib/studio');

describe('set-config', () => {
  let sandbox;
  let studio;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    studio = new Studio({});
    sandbox.stub(upload, 'url');
    sandbox.stub(studio, 'fail');
    sandbox.stub(studio, 'setUpload');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sets config to given values merged with defaults', () => {
    studio.setConfig({ token: '123-456-789' });

    assert.deepEqual(studio.config, {
      token: '123-456-789',
      protocol: 'https:',
      hostname: 'api.javascript.studio',
      port: null,
      basepath: '/beta'
    });
  });

  it('fetches upload URL', () => {
    studio.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(upload.url);
    sinon.assert.calledWith(upload.url, studio.config, null, sinon.match.func);
  });

  it('fails if fetching the upload URL errs', () => {
    upload.url.yields(new Error('No'));

    studio.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(studio.fail);
    sinon.assert.calledWith(studio.fail, 'Failed to get upload URL');
  });

  it('calls setUpload if fetching the upload URL succeeds', () => {
    upload.url.yields(null, {
      url: 'http://localhost:9000/uploads',
      number: 42
    });

    studio.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(studio.setUpload);
    sinon.assert.calledWith(studio.setUpload, {
      url: 'http://localhost:9000/uploads',
      number: 42
    });
  });

});
