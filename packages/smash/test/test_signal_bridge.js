'use strict';

const assert = require('node:assert/strict');
const {
  createSignalEnvelope,
  routeSignalToSmash,
  getSignalLog,
  clearSignalLog,
} = require('../src/signalBridge');

clearSignalLog();

const envelope = createSignalEnvelope({
  state_hint: 'mehrkernig',
  text_ref: 'draft-1:p3',
});

assert.equal(envelope.source, 'loom');
assert.equal(envelope.state_hint, 'mehrkernig');
assert.equal(envelope.blockage_hint, 'thread_loss');
assert.equal(envelope.text_ref, 'draft-1:p3');
assert.equal(typeof envelope.received_at, 'string');

const routed1 = routeSignalToSmash({ state_hint: 'konfliktaer' });
const routed2 = routeSignalToSmash({ state_hint: 'unknown-state' });

assert.equal(routed1.queue, 'smash-intake');
assert.equal(routed1.envelope.state_hint, 'konfliktaer');
assert.equal(routed2.envelope.state_hint, 'stabil');

const log = getSignalLog();
assert.equal(log.length, 2);
assert.equal(log[0].id, 'smash-signal-1');
assert.equal(log[1].id, 'smash-signal-2');

console.log('SMASH signal bridge tests passed.');
