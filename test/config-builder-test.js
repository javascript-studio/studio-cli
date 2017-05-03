/*eslint-env mocha*/
'use strict';

const assert = require('assert');
const config_builder = require('../lib/config-builder');

describe('config-builder', () => {

  it('returns default API', () => {
    const config = config_builder.build({
      account: 'mantoni',
      token: '123-456'
    });

    assert.deepEqual(config, {
      protocol: 'https:',
      hostname: 'api.javascript.studio',
      port: null,
      basepath: '/beta',
      account: 'mantoni',
      token: '123-456'
    });
  });

  it('returns given API', () => {
    const config = config_builder.build({
      api: 'http://localhost:1337/test',
      account: 'mantoni',
      token: '123-456'
    });

    assert.deepEqual(config, {
      protocol: 'http:',
      hostname: 'localhost',
      port: '1337',
      basepath: '/test',
      account: 'mantoni',
      token: '123-456'
    });
  });

});
