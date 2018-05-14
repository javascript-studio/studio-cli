/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const PassThrough = require('stream').PassThrough;
const sinon = require('sinon');
const Studio = require('../lib/studio');

describe('read-stream', () => {
  let studio;

  beforeEach(() => {
    studio = new Studio({});
    sinon.stub(studio, 'setSource');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('reads stdin content and sets source', (done) => {
    const stream = new PassThrough();
    sinon.stub(process, 'stdin').get(() => stream);

    studio.readStream();
    process.stdin.write('console.log("Hi!")');
    process.stdin.end();

    setTimeout(() => {
      sinon.assert.calledOnce(studio.setSource);
      sinon.assert.calledWith(studio.setSource, 'console.log("Hi!")');
      done();
    }, 1);
  });

  it('reads file content and sets source', (done) => {
    const stream = new PassThrough();
    sinon.stub(fs, 'createReadStream').returns(stream);
    studio.argv.file = 'some/file.js';

    studio.readStream();
    stream.write('console.log("Hi!")');
    stream.end();

    setTimeout(() => {
      sinon.assert.calledOnce(studio.setSource);
      sinon.assert.calledWith(studio.setSource, 'console.log("Hi!")');
      done();
    }, 1);
  });

});
