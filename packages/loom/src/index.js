'use strict';

const shared = require('@loot/shared');
const clause = require('./clauseDetector');
const chunker = require('./chunker');
const structural = require('./structuralState');
const signals = require('./signalLayer');

module.exports = {
  ...shared,
  ...clause,
  ...chunker,
  ...structural,
  ...signals,
};
