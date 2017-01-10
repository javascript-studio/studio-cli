/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const sinon = require('sinon');
const config = require('../lib/config');

describe('read', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(fs, 'readFile');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('reads given file', () => {
    config.read('some/file', () => {});

    sinon.assert.calledOnce(fs.readFile);
    sinon.assert.calledWith(fs.readFile, 'some/file', 'utf8', sinon.match.func);
  });

  it('yields an empty object if file can not be read', () => {
    fs.readFile.yields(new Error('EWHATEVER'));
    const spy = sinon.spy();

    config.read('that/file', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, {});
  });

  it('yields config from file', () => {
    fs.readFile.yields(null, '# JavaScript Studio Config\n'
      + 'api=http://localhost:1337\n'
      + 'account=mantoni\n'
      + 'token=123-456-789\n');
    const spy = sinon.spy();

    config.read('this/file', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, {
      api: 'http://localhost:1337',
      account: 'mantoni',
      token: '123-456-789'
    });
  });

  it('yields error if a line is invalid', () => {
    fs.readFile.yields(null, 'notasetting');
    const spy = sinon.spy();

    config.read('another/file', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name: 'Error',
      message: 'Invalid line in config: "notasetting"'
    });
  });

});
