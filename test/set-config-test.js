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
    sandbox = sinon.createSandbox();
    studio = new Studio({});
    sandbox.stub(upload, 'url');
    sandbox.stub(studio, 'fail');
    sandbox.stub(studio, 'setUpload');
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.STUDIO_TOKEN;
    delete process.env.STUDIO_SECRET;
  });

  it('sets config to given values merged with defaults', () => {
    studio.setConfig({ token: '123-456-789' });

    assert.deepEqual(studio.config, {
      token: '123-456-789',
      secret: null,
      protocol: 'https:',
      hostname: 'api.javascript.studio',
      port: null,
      basepath: '/beta'
    });
  });

  it('fetches upload URL', () => {
    studio.setConfig({ token: '123-456-789' });

    sinon.assert.calledOnce(upload.url);
    sinon.assert.calledWith(upload.url, studio.config, {}, sinon.match.func);
  });

  it('fetches upload URL with encryption', () => {
    studio.setConfig({ token: '123-456-789', secret: 'qwerty' });

    sinon.assert.calledOnce(upload.url);
    sinon.assert.calledWith(upload.url, studio.config, {
      encryption: 'aes-128-ctr',
      iv: sinon.match(/^[0-9a-f]{32}$/)
    }, sinon.match.func);
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

  it('fails if called with empty object and STUDIO_TOKEN is missing', () => {
    studio.setConfig({});

    sinon.assert.calledOnce(studio.fail);
    sinon.assert.calledWith(studio.fail, 'Missing .studio or ~/.studio config '
      + 'file or STUDIO_TOKEN environment variable');
  });

  it('does not fail if called with empty object and STUDIO_TOKEN is defined',
    () => {
      process.env.STUDIO_TOKEN = '123';

      studio.setConfig({});

      sinon.assert.notCalled(studio.fail);
      sinon.assert.calledOnce(upload.url);
    });

  it('generates iv if secret is given', () => {
    const secret = '0123456789abcdef';

    studio.setConfig({ secret, token: 'abc' });

    assert.equal(studio.secret, secret);
    assert.equal(typeof studio.iv, 'object');
    assert.equal(studio.iv.length, 16);
  });

  it('generates iv if secret is set in env', () => {
    const secret = '0123456789abcdef';
    process.env.STUDIO_SECRET = secret;

    studio.setConfig({ token: 'abc' });

    assert.equal(studio.secret, secret);
    assert.equal(typeof studio.iv, 'object');
    assert.equal(studio.iv.length, 16);
  });

  it('does not generate iv if secret is not configured', () => {
    studio.setConfig({ token: 'abc' });

    assert.equal(typeof studio.iv, 'undefined');
  });

});
