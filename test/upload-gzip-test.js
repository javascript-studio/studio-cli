/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const PassThrough = require('stream').PassThrough;
const sinon = require('sinon');
const upload = require('../lib/upload');
const State = require('../lib/state');

describe('upload-gzip', () => {
  let sandbox;
  let state;
  let stream;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    state = new State({});
    state.upload_json = {
      url: 'http://localhost:9000/uploads',
      number: 42
    };
    state.gzip_buffer = new Buffer(42);
    sandbox.stub(state, 'fail');
    sandbox.stub(state, 'loadReport');
    stream = new PassThrough();
    sandbox.stub(stream, 'write');
    sandbox.stub(stream, 'end');
    sandbox.stub(upload, 'upload').returns(stream);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sets the spinner text to "Uploading"', () => {
    state.uploadGzip();

    assert.equal(state.spinner.text, 'Uploading');
  });

  it('uploads gzip buffer to upload URL', () => {
    state.uploadGzip();

    sinon.assert.calledOnce(upload.upload);
    sinon.assert.calledWith(upload.upload, 'http://localhost:9000/uploads', 42);
    sinon.assert.calledOnce(stream.write);
    sinon.assert.calledWith(stream.write, state.gzip_buffer);
    sinon.assert.calledOnce(stream.end);
  });

  it('fails if upload errs', () => {
    upload.upload.yields(new Error('Oh noes!'));

    state.uploadGzip();

    sinon.assert.calledOnce(state.fail);
    sinon.assert.calledWith(state.fail, 'Failed to upload file');
  });

  it('calls loadReport if upload succeeds', () => {
    upload.upload.yields(null);

    state.uploadGzip();

    sinon.assert.calledOnce(state.loadReport);
  });

});
