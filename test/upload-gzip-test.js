/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const PassThrough = require('stream').PassThrough;
const sinon = require('sinon');
const upload = require('../lib/upload');
const Studio = require('../lib/studio');

describe('upload-gzip', () => {
  let studio;
  let stream;

  beforeEach(() => {
    studio = new Studio({});
    studio.upload_json = {
      url: 'http://localhost:9000/uploads',
      number: 42
    };
    studio.gzip_buffer = new Buffer('console.log("Hi!")');
    sinon.stub(studio, 'fail');
    sinon.stub(studio, 'loadReport');
    stream = new PassThrough();
    sinon.stub(stream, 'write');
    sinon.stub(stream, 'end');
    sinon.stub(upload, 'url');
    sinon.stub(upload, 'upload').returns(stream);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('sets the spinner text to "Uploading"', () => {
    studio.uploadGzip();

    assert.equal(studio.spinner.text, 'Uploading');
  });

  it('uploads gzip buffer to upload URL', () => {
    studio.uploadGzip();

    sinon.assert.calledOnce(upload.upload);
    sinon.assert.calledWith(upload.upload, 'http://localhost:9000/uploads', 18);
    sinon.assert.calledOnce(stream.write);
    sinon.assert.calledWith(stream.write, studio.gzip_buffer);
    sinon.assert.calledOnce(stream.end);
  });

  it('uploads encrypted gzip buffer to upload URL', () => {
    const secret = crypto.randomBytes(16);
    const token = '123';
    studio.setConfig({ secret: secret.toString('hex'), token });
    studio.uploadGzip();

    const cipher = crypto.createCipheriv('aes-128-ctr', secret, studio.iv);
    const encrypted = Buffer.concat([
      cipher.update('console.log("Hi!")'),
      cipher.final()
    ]);

    sinon.assert.calledOnce(upload.upload);
    sinon.assert.calledWith(upload.upload, 'http://localhost:9000/uploads', 18);
    sinon.assert.calledOnce(stream.write);
    sinon.assert.calledWith(stream.write, encrypted);
    sinon.assert.calledOnce(stream.end);
  });

  it('fails if upload errs', () => {
    upload.upload.yields(new Error('Oh noes!'));

    studio.uploadGzip();

    sinon.assert.calledOnce(studio.fail);
    sinon.assert.calledWith(studio.fail, 'Failed to upload file');
  });

  it('calls loadReport if upload succeeds', () => {
    upload.upload.yields(null);

    studio.uploadGzip();

    sinon.assert.calledOnce(studio.loadReport);
  });

});
