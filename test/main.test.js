/**
 * Plugin for loglevel which allows defining prefixes for log messages
 *
 * Copyright (c) 2015-2016 University Of Helsinki (The National Library Of Finland)
 *
 * Licensed under the MIT License; see LICENSE.txt.
 *
 * Ported from mocha/chai/mockdate to node:test and node:assert. The cases are
 * upstream's, plus the call shapes our consumers rely on.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const log = require('loglevel');
const loglevelMessagePrefix = require('../lib/main');

/** A method factory that records the joined message, as upstream's tests did. */
function capture(sink) {
  return function () {
    return function () {
      const args = [];
      for (let i = 0; i < arguments.length; ++i) {
        args.push(typeof arguments[i] === 'object' ? JSON.stringify(arguments[i]) : arguments[i].toString());
      }
      sink.message = args.join('');
    };
  };
}

describe('main', () => {

  it('Should be a function', () => {
    assert.equal(typeof loglevelMessagePrefix, 'function');
  });

  it('Should throw because argument is not an object', () => {
    assert.throws(() => loglevelMessagePrefix(), /Argument is not a proper loglevel object/);
  });

  it('Should throw because argument is not a proper loglevel object', () => {
    assert.throws(() => loglevelMessagePrefix({}), /Argument is not a proper loglevel object/);
  });

  it('Should return the same loglevel object that was passed in as an argument', () => {
    const logger = log.getLogger('foo');
    const keys = Object.keys(logger);
    const result = loglevelMessagePrefix(logger);
    assert.equal(result, logger);
    assert.deepEqual(Object.keys(result).sort(), keys.sort());
  });

  it('Should retain the original log level', () => {
    const logger = log.getLogger('foo');
    logger.setLevel('debug');
    assert.equal(loglevelMessagePrefix(logger).getLevel(), 1);
  });

  it("Should only display a 'level' dynamic prefix", () => {
    const sink = {};
    const logger = log.getLogger('foo');
    loglevelMessagePrefix(logger, { prefixes: ['level'] }, capture(sink));
    logger.warn('TEST');
    assert.equal(sink.message, '[WARN]: TEST');
  });

  it("Should only display static prefixes 'foo' and 'bar'", () => {
    const sink = {};
    const logger = log.getLogger('foo');
    loglevelMessagePrefix(logger, { prefixes: [], staticPrefixes: ['foo', 'bar'] }, capture(sink));
    logger.warn('TEST');
    assert.equal(sink.message, '[foo bar]: TEST');
  });

  it("Should display dynamic prefix 'timestamp', static prefix 'foobar' and use '/' as a separator", (t) => {
    const sink = {};
    const locale = 'en-US';
    const timezone = 'UTC';
    const date = new Date(Date.UTC(2001, 0, 1, 1, 1, 1));
    const opts = { hour12: false, timeZone: timezone };
    const timestamp = date.toLocaleDateString(locale, opts) + ' ' + date.toLocaleTimeString(locale, opts);
    const logger = log.getLogger('foo');

    t.mock.timers.enable({ apis: ['Date'], now: date });

    loglevelMessagePrefix(logger, {
      prefixes: ['timestamp'],
      staticPrefixes: ['foobar'],
      separator: '/',
      options: { timestamp: { locale: locale, timezone: timezone, hour12: false } }
    }, capture(sink));

    logger.warn('TEST');
    assert.equal(sink.message, '[' + timestamp + '/foobar]: TEST');
  });

  it('Should default to an ISO timestamp and the level', (t) => {
    const sink = {};
    const date = new Date(Date.UTC(2001, 0, 1, 1, 1, 1));
    const logger = log.getLogger('defaults');

    t.mock.timers.enable({ apis: ['Date'], now: date });

    loglevelMessagePrefix(logger, undefined, capture(sink));
    logger.warn('TEST');
    assert.equal(sink.message, '[2001-01-01T01:01:01.000Z WARN]: TEST');
  });

  it('Should accept variadic arguments', () => {
    let messages;
    const logger = log.getLogger('foo');

    loglevelMessagePrefix(logger, { prefixes: ['level'] }, () => function () {
      messages = arguments;
    });

    logger.warn(1, 'TEST', true);
    assert.deepEqual(Array.from(messages), ['[WARN]: ', 1, 'TEST', true]);

    logger.warn();
    assert.deepEqual(Array.from(messages), ['[WARN]: ']);
  });

  it('Should pass context to the next plugin', () => {
    let called = false;

    function mockPlugin(logger) {
      logger.methodFactory = function () {
        return function () {
          called = true;
          assert.notEqual(this, undefined);
        };
      };
      return logger;
    }

    const logger = loglevelMessagePrefix(mockPlugin(log.getLogger('foobar')));
    logger.error('foobar');
    assert.ok(called);
  });

});

// How TheTechNetwork/CyberChef calls it from its web workers: the default
// loglevel instance, no dynamic prefixes and one static prefix.
describe('consumer call shapes', () => {

  it('prefixes the root logger with a static worker name', () => {
    const lines = [];
    const original = log.methodFactory;
    log.methodFactory = function () {
      return function () {
        lines.push(Array.from(arguments));
      };
    };

    try {
      const result = loglevelMessagePrefix(log, { prefixes: [], staticPrefixes: ['ChefWorker'] });
      assert.equal(result, log);
      log.setLevel('debug', false);
      log.debug("Receiving command 'bake'");
      assert.deepEqual(lines.pop(), ['[ChefWorker]: ', "Receiving command 'bake'"]);
    } finally {
      log.methodFactory = original;
      log.setLevel('warn', false);
    }
  });

  it('is the default export under an ESM import', async () => {
    const mod = await import('../lib/main.js');
    assert.equal(mod.default, loglevelMessagePrefix);
  });

  it('loads through the AMD branch with loglevel as its only dependency', () => {
    // webpack exposes define.amd, so bundlers take this branch rather than
    // the CommonJS one.
    const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'main.js'), 'utf8');
    let deps, exported;
    const define = function (d, factory) {
      deps = d;
      exported = factory(log);
    };
    define.amd = {};
    vm.runInNewContext(source, { define: define });

    assert.deepEqual(Array.from(deps), ['loglevel']);
    assert.equal(typeof exported, 'function');
    assert.equal(exported(log.getLogger('amd')), log.getLogger('amd'));
  });

});
