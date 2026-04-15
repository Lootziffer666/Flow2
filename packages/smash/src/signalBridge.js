'use strict';

const KNOWN_STATE_HINTS = new Set([
  'stabil',
  'mehrkernig',
  'konfliktaer',
  'formal_stabil_semantisch_leer',
  'normativ_selbstannullierend',
  'performativ_instabil',
]);

const DEFAULT_BLOCKAGE_BY_STATE = {
  stabil: 'none',
  mehrkernig: 'thread_loss',
  konfliktaer: 'decision_overload',
  formal_stabil_semantisch_leer: 'semantic_dryness',
  normativ_selbstannullierend: 'self_block',
  performativ_instabil: 'paradox_loop',
};

const signalLog = [];

function normalizeStateHint(stateHint) {
  const key = String(stateHint || '').trim();
  return KNOWN_STATE_HINTS.has(key) ? key : 'stabil';
}

function createSignalEnvelope(input = {}) {
  const state_hint = normalizeStateHint(input.state_hint || input.state);
  const blockage_hint = input.blockage_hint || DEFAULT_BLOCKAGE_BY_STATE[state_hint] || 'unspecified';

  return {
    source: 'loom',
    state_hint,
    blockage_hint,
    text_ref: input.text_ref || null,
    received_at: new Date().toISOString(),
  };
}

function routeSignalToSmash(input = {}, options = {}) {
  const envelope = createSignalEnvelope(input);
  const entry = {
    id: `smash-signal-${signalLog.length + 1}`,
    queue: 'smash-intake',
    envelope,
  };

  signalLog.push(entry);

  if (typeof options.logger === 'function') {
    options.logger(entry);
  }

  return entry;
}

function getSignalLog() {
  return signalLog.slice();
}

function clearSignalLog() {
  signalLog.length = 0;
}

module.exports = {
  KNOWN_STATE_HINTS,
  DEFAULT_BLOCKAGE_BY_STATE,
  createSignalEnvelope,
  routeSignalToSmash,
  getSignalLog,
  clearSignalLog,
};
