'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { phoneticallyEqual } = require('@loot/loom');

const CSV_PATH = path.join(__dirname, '..', '..', '..', 'corpora', 'German_Annotation_V028.csv');

let cachedLexicon = null;
let cachedErrorMap = null;

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFC');
}

function splitSemicolonRow(row) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i];
    if (ch === '"') {
      const next = row[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ';' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function loadLexicon() {
  if (cachedLexicon) return cachedLexicon;

  if (!fs.existsSync(CSV_PATH)) {
    cachedLexicon = [];
    return cachedLexicon;
  }

  const raw = fs.readFileSync(CSV_PATH, 'latin1');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) {
    cachedLexicon = [];
    return cachedLexicon;
  }

  const header = splitSemicolonRow(lines[0]);
  const idxCorrect = header.findIndex((h) => h === 'Correct_Word');
  if (idxCorrect === -1) {
    cachedLexicon = [];
    return cachedLexicon;
  }

  const set = new Set();
  for (let i = 1; i < lines.length; i += 1) {
    const parts = splitSemicolonRow(lines[i]);
    const candidate = normalize(parts[idxCorrect] || '');
    if (!candidate || candidate.includes('_')) continue;
    if (!/^[a-zäöüß]+$/iu.test(candidate)) continue;
    set.add(candidate);
  }

  cachedLexicon = [...set];
  return cachedLexicon;
}


function loadErrorMap() {
  if (cachedErrorMap) return cachedErrorMap;

  if (!fs.existsSync(CSV_PATH)) {
    cachedErrorMap = new Map();
    return cachedErrorMap;
  }

  const raw = fs.readFileSync(CSV_PATH, 'latin1');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) {
    cachedErrorMap = new Map();
    return cachedErrorMap;
  }

  const header = splitSemicolonRow(lines[0]);
  const idxCorrect = header.findIndex((h) => h === 'Correct_Word');
  const idxError = header.findIndex((h) => h === 'Error_Word');
  if (idxCorrect === -1 || idxError === -1) {
    cachedErrorMap = new Map();
    return cachedErrorMap;
  }

  const candidates = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const parts = splitSemicolonRow(lines[i]);
    const error = normalize(parts[idxError] || '');
    const correct = normalize(parts[idxCorrect] || '');

    if (!error || !correct) continue;
    if (!candidates.has(error)) candidates.set(error, new Map());
    const counts = candidates.get(error);
    counts.set(correct, (counts.get(correct) || 0) + 1);
  }

  const resolved = new Map();

  for (const [error, counts] of candidates) {
    let bestWord = null;
    let bestCount = 0;
    let isTie = false;

    for (const [word, count] of counts) {
      if (count > bestCount) {
        bestWord = word;
        bestCount = count;
        isTie = false;
      } else if (count === bestCount) {
        isTie = true;
      }
    }

    if (bestWord && !isTie && bestWord !== error) {
      resolved.set(error, bestWord);
    }
  }

  cachedErrorMap = resolved;
  return cachedErrorMap;
}

function getCorpusPairFallback(inputWord) {
  const input = normalize(inputWord);
  if (!input) return null;

  const errorMap = loadErrorMap();
  return errorMap.get(input) || null;
}

function damerauLevenshtein(a, b) {
  const left = [...normalize(a)];
  const right = [...normalize(b)];
  const rows = left.length + 1;
  const cols = right.length + 1;

  const dist = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dist[i][0] = i;
  for (let j = 0; j < cols; j += 1) dist[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );

      if (
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      ) {
        dist[i][j] = Math.min(dist[i][j], dist[i - 2][j - 2] + 1);
      }
    }
  }

  return dist[rows - 1][cols - 1];
}

function resolveMaxDistance(word) {
  const len = normalize(word).length;
  if (len <= 4) return 1;
  if (len <= 8) return 2;
  return 3;
}

function getLexiconFallback(inputWord) {
  const input = normalize(inputWord);
  if (!input) return null;
  if (!/^[a-zäöüß]+$/iu.test(input)) return null;

  const lexicon = loadLexicon();
  if (!lexicon.length) return null;

  const maxDistance = resolveMaxDistance(input);
  let best = null;

  for (const candidate of lexicon) {
    if (candidate === input) return null;

    const distance = damerauLevenshtein(input, candidate);
    if (distance > maxDistance) continue;

    const firstLetterMatch = input[0] === candidate[0];
    const phoneticMatch = phoneticallyEqual(input, candidate);
    if (!firstLetterMatch && !phoneticMatch) continue;

    if (!best || distance < best.distance || (distance === best.distance && candidate.length < best.word.length)) {
      best = { word: candidate, distance, phoneticMatch };
    }
  }

  return best ? best.word : null;
}

module.exports = {
  getCorpusPairFallback,
  getLexiconFallback,
  damerauLevenshtein,
  loadLexicon,
  loadErrorMap,
};
