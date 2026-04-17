'use strict';

/**
 * Canonical clause connector knowledge for LOOM.
 *
 * Shared cross-product language truth (DE/EN):
 * - subordinating conjunctions
 * - coordinating conjunctions
 */

const SUBORDINATING_DE_LIST = Object.freeze([
  'dass', 'weil', 'obwohl', 'obgleich', 'obschon',
  'wenn', 'falls', 'sofern', 'soweit',
  'ob', 'ob…oder',
  'während', 'nachdem', 'bevor', 'ehe', 'bis', 'seit', 'seitdem', 'sobald', 'solange',
  'damit', 'sodass', 'so dass',
  'indem', 'dadurch dass',
  'da', 'zumal',
  'als',
  'wie',
  'wenngleich', 'wennschon',
  'obwohl',
]);

const COORDINATING_DE_LIST = Object.freeze([
  'und', 'oder', 'aber', 'sondern', 'denn',
  'doch', 'jedoch', 'allerdings',
  'trotzdem', 'dennoch',
  'außerdem', 'zudem', 'überdies',
  'deshalb', 'daher', 'darum', 'deswegen',
  'nämlich', 'also',
  'entweder', 'weder', 'sowohl',
]);

const SUBORDINATING_EN_LIST = Object.freeze([
  'that', 'because', 'since', 'as',
  'although', 'though', 'even though', 'whereas',
  'if', 'unless', 'provided', 'in case',
  'when', 'while', 'after', 'before', 'until', 'once', 'as soon as',
  'so that', 'in order that',
  'whether',
]);

const COORDINATING_EN_LIST = Object.freeze([
  'and', 'or', 'but', 'nor', 'for', 'yet', 'so',
  'however', 'therefore', 'thus', 'nevertheless', 'nonetheless',
  'furthermore', 'moreover', 'besides',
]);

const SUBORDINATING_DE = new Set(SUBORDINATING_DE_LIST);
const COORDINATING_DE = new Set(COORDINATING_DE_LIST);
const SUBORDINATING_EN = new Set(SUBORDINATING_EN_LIST);
const COORDINATING_EN = new Set(COORDINATING_EN_LIST);

module.exports = {
  SUBORDINATING_DE_LIST,
  COORDINATING_DE_LIST,
  SUBORDINATING_EN_LIST,
  COORDINATING_EN_LIST,
  SUBORDINATING_DE,
  COORDINATING_DE,
  SUBORDINATING_EN,
  COORDINATING_EN,
};
