/*eslint-env mocha*/
'use strict';

const PassThrough = require('stream').PassThrough;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const ora = require('ora');
const config_builder = require('../lib/config-builder');

const INITIAL_REQUEST_DELAY = 250;

describe('load-report', () => {
  let clock;
  let request;
  let config;
  let argv;
  let spinner;
  let stderr;
  let callback;
  let load_report;

  beforeEach(() => {
    request = sinon.stub();
    load_report = proxyquire('../lib/load-report', {
      './request': request
    });
    config = {};
    argv = {};
    clock = sinon.useFakeTimers();
    stderr = new PassThrough();
    sinon.stub(stderr, 'write');
    spinner = ora({ text: '', stream: stderr });
    config = config_builder.build({ token: '123' });
    callback = sinon.spy();
  });

  afterEach(() => {
    clock.restore();
  });

  it('fires upload request with initial delay', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY - 1);

    sinon.assert.notCalled(request);

    clock.tick(1);

    sinon.assert.calledOnce(request);
    sinon.assert.calledWith(request, config, {
      path: '/uploads/1',
      expect: 200,
      timeout: 5000
    });
  });

  it('requests exceptions', () => {
    argv.exceptions = true;

    load_report(config, 2, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    sinon.assert.calledOnce(request);
    sinon.assert.calledWithMatch(request, config, {
      path: '/uploads/2?exceptions=1'
    });
  });

  it('yields request error', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    const err = new Error();
    request.yield(err);

    sinon.assert.calledOnce(callback);
    sinon.assert.calledWith(callback, err);
  });

  it('retries if build status is CREATED', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'CREATED' });
    clock.tick(INITIAL_REQUEST_DELAY * 2);

    sinon.assert.calledTwice(request);
  });

  it('retries if build status is ANALYZING', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'ANALYZING' });
    clock.tick(INITIAL_REQUEST_DELAY * 2);

    sinon.assert.calledTwice(request);
  });

  it('retries again if build status is ANALYZING', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'CREATED' });
    clock.tick(INITIAL_REQUEST_DELAY * 2);
    request.yield(null, { status: 'ANALYZING' });
    clock.tick(INITIAL_REQUEST_DELAY * 4);

    sinon.assert.calledThrice(request);
  });

  it('does not delay requests more than 4 seconds', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.getCall(0).yield(null, { status: 'CREATED' });
    clock.tick(INITIAL_REQUEST_DELAY * 2);
    request.getCall(1).yield(null, { status: 'ANALYZING' });
    clock.tick(INITIAL_REQUEST_DELAY * 4);
    request.getCall(2).yield(null, { status: 'ANALYZING' });
    clock.tick(INITIAL_REQUEST_DELAY * 8);
    request.getCall(3).yield(null, { status: 'ANALYZING' });
    clock.tick(INITIAL_REQUEST_DELAY * 16);
    request.getCall(4).yield(null, { status: 'ANALYZING' });
    clock.tick(INITIAL_REQUEST_DELAY * 16); // <-- Same as previous delay

    sinon.assert.callCount(request, 6);
  });

  it('yields timeout error if status is ANALYZING after 35 seconds', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    clock.tick(35000);
    request.yield(null, { status: 'ANALYZING' });

    sinon.assert.calledOnce(callback);
    sinon.assert.calledWithMatch(callback,
      sinon.match.instanceOf(Error).and(sinon.match({
        name: 'Error',
        message: 'Timeout'
      }))
    );
  });

  it('yields result if status is SUCCESS after 35 seconds', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    clock.tick(35000);
    request.yield(null, { status: 'SUCCESS' });

    sinon.assert.calledOnce(callback);
    sinon.assert.calledWith(callback, null, {
      status: 'SUCCESS'
    });
  });

  it('yields error if build status is unknown', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'WAIT_WHAT_IS_THIS' });

    sinon.assert.calledOnce(callback);
    sinon.assert.calledWithMatch(callback, {
      name: 'Error',
      message: 'Unknown build status "WAIT_WHAT_IS_THIS"'
    });
  });

  it('shows error message if build status is ERROR', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'ERROR' });

    sinon.assert.calledOnce(stderr.write);
    sinon.assert.calledWith(stderr.write, '🚨  Build error\n');
  });

  it('shows failure message if build status is FAILED', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'FAILED' });

    sinon.assert.calledOnce(stderr.write);
    sinon.assert.calledWith(stderr.write, '⚠️  Build completed with issues\n');
  });

  it('shows success message if build status is SUCCESS', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'SUCCESS' });

    sinon.assert.calledOnce(stderr.write);
    sinon.assert.calledWith(stderr.write,
      '✅  Build completed. No issues found.\n');
  });

  it('shows error message with message', () => {
    load_report(config, 1, argv, spinner, callback);
    clock.tick(INITIAL_REQUEST_DELAY);

    request.yield(null, { status: 'FAILED', message: 'Oh noes!' });

    sinon.assert.calledOnce(stderr.write);
    sinon.assert.calledWith(stderr.write,
      '⚠️  Build completed with issues - Oh noes!\n');
  });

});
