/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const config_builder = require('../lib/config-builder');

describe('config-builder', () => {

  afterEach(() => {
    delete process.env.STUDIO_TOKEN;
    delete process.env.STUDIO_SECRET;
  });

  it('returns default API', () => {
    const config = config_builder.build({
      token: '123-456'
    });

    assert.deepEqual(config, {
      protocol: 'https:',
      hostname: 'api.javascript.studio',
      port: null,
      basepath: '/beta',
      token: '123-456',
      secret: null
    });
  });

  it('returns given API', () => {
    const config = config_builder.build({
      api: 'http://localhost:1337/test',
      token: '123-456'
    });

    assert.deepEqual(config, {
      protocol: 'http:',
      hostname: 'localhost',
      port: '1337',
      basepath: '/test',
      token: '123-456',
      secret: null
    });
  });

  it('uses token from environment', () => {
    process.env.STUDIO_TOKEN = '789-000';

    const config = config_builder.build({
      token: '123-456'
    });

    assert.equal(config.token, '789-000');
  });

  it('uses secret from config', () => {
    const config = config_builder.build({
      secret: 'abcdef'
    });

    assert.equal(config.secret, 'abcdef');
  });

  it('uses secret from environment', () => {
    process.env.STUDIO_SECRET = '123456';

    const config = config_builder.build({
      secret: 'abcdef'
    });

    assert.equal(config.secret, '123456');
  });

});
