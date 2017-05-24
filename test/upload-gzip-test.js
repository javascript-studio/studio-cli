/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const PassThrough = require('stream').PassThrough;
const sinon = require('sinon');
const upload = require('../lib/upload');
const Studio = require('../lib/studio');

describe('upload-gzip', () => {
  let sandbox;
  let studio;
  let stream;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    studio = new Studio({});
    studio.upload_json = {
      url: 'http://localhost:9000/uploads',
      number: 42
    };
    studio.gzip_buffer = new Buffer(42);
    sandbox.stub(studio, 'fail');
    sandbox.stub(studio, 'loadReport');
    stream = new PassThrough();
    sandbox.stub(stream, 'write');
    sandbox.stub(stream, 'end');
    sandbox.stub(upload, 'upload').returns(stream);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sets the spinner text to "Uploading"', () => {
    studio.uploadGzip();

    assert.equal(studio.spinner.text, 'Uploading');
  });

  it('uploads gzip buffer to upload URL', () => {
    studio.uploadGzip();

    sinon.assert.calledOnce(upload.upload);
    sinon.assert.calledWith(upload.upload, 'http://localhost:9000/uploads', 42);
    sinon.assert.calledOnce(stream.write);
    sinon.assert.calledWith(stream.write, studio.gzip_buffer);
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
