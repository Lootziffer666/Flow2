'use strict';

/**
 * @loot/loom — Strukturelle Verarbeitungs- und Diagnoseschicht
 *
 * LOOM ist die gemeinsame Interpretationslogik des Ökosystems.
 * Alle Produkte (FLOW, SPIN, SMASH) beziehen ihre Struktursignale aus LOOM.
 *
 * Module:
 *   clauseDetector   — Satz- und Teilsatzstruktur (Komplexitätsklassifikation)
 *   chunker          — Heuristischer Zerlegung in funktionale Einheiten
 *   structuralState  — Diagnose struktureller Zustände (8 Zustände)
 *   signalLayer      — Produktspezifische Signalableitung (FLOW/SPIN/SMASH)
 *   markers          — Konfigurierbare Marker-Sets für Diagnose
 *
 * CJS-Einstiegspunkt (require). ESM-Wrapper: ../index.mjs
 */

// ── clauseDetector ───────────────────────────────────────────────────────────
const clauseDetector = require('./clauseDetector');
exports.detectClauses         = clauseDetector.detectClauses;
exports.splitSentences        = clauseDetector.splitSentences;
exports.SUBORDINATING_DE      = clauseDetector.SUBORDINATING_DE;
exports.COORDINATING_DE       = clauseDetector.COORDINATING_DE;
exports.SUBORDINATING_EN      = clauseDetector.SUBORDINATING_EN;
exports.COORDINATING_EN       = clauseDetector.COORDINATING_EN;

// ── chunker ───────────────────────────────────────────────────────────────────
const chunker = require('./chunker');
exports.chunkSentence   = chunker.chunkSentence;
exports.chunkText       = chunker.chunkText;
exports.tokenizeText    = chunker.tokenizeText;
exports.tagTokens       = chunker.tagTokens;
exports.TAG             = chunker.TAG;
exports.COPULA_DE       = chunker.COPULA_DE;
exports.COPULA_EN       = chunker.COPULA_EN;

// ── structuralState ───────────────────────────────────────────────────────────
const structuralState = require('./structuralState');
exports.STATES            = structuralState.STATES;
exports.diagnoseChunks    = structuralState.diagnoseChunks;
exports.diagnoseText      = structuralState.diagnoseText;
exports.diagnoseFullText  = structuralState.diagnoseFullText;
exports.getChunkText      = structuralState.getChunkText;

// ── signalLayer ───────────────────────────────────────────────────────────────
const signalLayer = require('./signalLayer');
exports.flowSignals   = signalLayer.flowSignals;
exports.spinSignals   = signalLayer.spinSignals;
exports.smashSignals  = signalLayer.smashSignals;
exports.deriveSignals = signalLayer.deriveSignals;

// ── markers ───────────────────────────────────────────────────────────────────
const markers = require('./markers');
exports.META_MARKERS_DEFAULT     = markers.META_MARKERS_DEFAULT;
exports.NULL_MARKERS_DEFAULT     = markers.NULL_MARKERS_DEFAULT;
exports.NEGATIVE_POLARITY_DEFAULT = markers.NEGATIVE_POLARITY_DEFAULT;
exports.NORM_NEGATORS_DEFAULT    = markers.NORM_NEGATORS_DEFAULT;

// ── @loot/shared re-exports (LOOM is a superset of shared) ───────────────────
const shared = require('@loot/shared');
exports.filterByConfidence    = shared.filterByConfidence;
exports.errorProfile          = shared.errorProfile;
exports.DEFAULT_MIN_CONFIDENCE = shared.DEFAULT_MIN_CONFIDENCE;
exports.kölnerPhonetik        = shared.kölnerPhonetik;
exports.phoneticallyEqual     = shared.phoneticallyEqual;
exports.findPhoneticMatch     = shared.findPhoneticMatch;
exports.contextWindowRules    = shared.contextWindowRules;
exports.GR_RULES              = shared.GR_RULES;
