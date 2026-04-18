'use strict';

/**
 * LOOM Chunking Engine
 *
 * Zerlegt einen Satz deterministisch in funktionale Einheiten (Chunks):
 *   core.subject    — Handlungsträger / Subjekt
 *   core.predicate  — Verbalkomplex (finite + Hilfsverben)
 *   core.object     — Direktes Objekt
 *   state           — Zustandsausdruck (Kopula + Komplement)
 *   relation        — Nebensatz / Subordination
 *   ornament        — Adjektive, Adverbien, Partikel
 *   apposition      — Einschub, Attribut
 *
 * Ansatz: rein regelbasiert (keine stochastischen Modelle).
 * Heuristiken orientieren sich an deutschen Satzstellungsregeln (V2-Regel)
 * und englischen SVO-Mustern.
 *
 * Rückgabe von chunkSentence():
 * {
 *   tokens:  [{ id, text, tag }],          // POS-Schätzung
 *   chunks:  [{ id, type, tokenIds, text }] // Chunk-Zuordnung
 * }
 */

// ---------------------------------------------------------------------------
// Interne Token-Typ-Labels (vereinfachtes POS-Set)
// ---------------------------------------------------------------------------

const TAG = {
  PRON:       'PRON',
  VERB:       'VERB',
  AUX:        'AUX',
  NOUN:       'NOUN',
  ADJ:        'ADJ',
  ADV:        'ADV',
  DET:        'DET',
  PREP:       'PREP',
  CONJ_SUB:   'CONJ_SUB',
  CONJ_COORD: 'CONJ_COORD',
  PUNCT:      'PUNCT',
  OTHER:      'OTHER',
};

// ---------------------------------------------------------------------------
// Wortlisten
// ---------------------------------------------------------------------------

const PRONOUNS_DE = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'mich', 'dich', 'ihn', 'uns', 'euch',
  'mir', 'dir', 'ihm', 'ihnen',
  'man', 'jemand', 'niemand', 'wer',
  'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes',
]);

const PRONOUNS_EN = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'someone', 'nobody', 'everyone', 'who',
  'this', 'that', 'these', 'those',
]);

const AUXILIARIES_DE = new Set([
  'bin', 'bist', 'ist', 'sind', 'seid',
  'war', 'warst', 'waren', 'wart',
  'werde', 'wirst', 'wird', 'werden', 'werdet',
  'habe', 'hast', 'hat', 'haben', 'habt',
  'hatte', 'hattest', 'hatten', 'hattet',
  'kann', 'kannst', 'können', 'könnt',
  'soll', 'sollst', 'sollen', 'sollt',
  'will', 'willst', 'wollen', 'wollt',
  'muss', 'musst', 'müssen', 'müsst',
  'darf', 'darfst', 'dürfen', 'dürft',
  'mag', 'magst', 'mögen', 'mögt',
]);

const AUXILIARIES_EN = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had',
  'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must',
  'do', 'does', 'did',
]);

const DETERMINERS_DE = new Set([
  'der', 'die', 'das', 'des', 'dem', 'den',
  'ein', 'eine', 'eines', 'einem', 'einen', 'einer',
  'kein', 'keine', 'keines', 'keinem', 'keinen',
  'mein', 'meine', 'meines', 'meinem', 'meinen',
  'dein', 'deine', 'sein', 'ihre', 'unser', 'euer',
  'jeder', 'jede', 'jedes', 'alle', 'viele', 'einige',
]);

const DETERMINERS_EN = new Set([
  'the', 'a', 'an',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'each', 'every', 'all', 'some', 'any',
  'no',
]);

const PREPOSITIONS_DE = new Set([
  'in', 'an', 'auf', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen',
  'mit', 'ohne', 'durch', 'für', 'gegen', 'um', 'aus', 'bei', 'nach',
  'seit', 'von', 'zu', 'während', 'wegen', 'trotz', 'statt',
  'bis', 'ab', 'als', 'außer',
]);

const PREPOSITIONS_EN = new Set([
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over',
  'under', 'to', 'of', 'near', 'around', 'along',
]);

const SUBORDINATING_DE = new Set([
  'dass', 'weil', 'obwohl', 'obgleich', 'obschon',
  'wenn', 'falls', 'sofern', 'soweit',
  'ob', 'während', 'nachdem', 'bevor', 'ehe', 'bis',
  'seit', 'seitdem', 'sobald', 'solange',
  'damit', 'sodass', 'so dass',
  'indem', 'da', 'zumal', 'als', 'wie', 'wenngleich',
]);

const SUBORDINATING_EN = new Set([
  'that', 'because', 'since', 'as',
  'although', 'though', 'even', 'whereas',
  'if', 'unless', 'provided',
  'when', 'while', 'after', 'before', 'until', 'once',
  'whether', 'who', 'which', 'where',
]);

// Verb-Suffixe (Deutsch) als Heuristik für finite Verbformen.
// Reihenfolge: längere Suffixe zuerst, damit 'en' vor 'e' matcht usw.
// Lowercase-Wörter, die mit -t enden, sind in DE meistens Verbformen (3. Person Sg./Pl.).
// Kapitalisierte Wörter werden bereits vorher als NOUN erkannt.
const VERB_SUFFIXES_DE = ['test', 'tet', 'ten', 'st', 'et', 'te', 'en', 'e', 't'];

// Zustandsverben (Kopula)
const COPULA_DE = new Set(['bin', 'bist', 'ist', 'sind', 'seid', 'war', 'warst', 'waren', 'wart', 'werde', 'wird', 'werden', 'wirst']);
const COPULA_EN = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'seem', 'seems', 'seemed', 'appear', 'appears', 'become', 'becomes', 'became']);

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

/**
 * Zerlegt einen Text in Tokens mit Position.
 * @param {string} text
 * @returns {string[]}
 */
function tokenizeText(text) {
  // Split on whitespace, separate punctuation
  return String(text || '')
    .trim()
    .split(/(\s+|[.,;:!?()\[\]"«»„"‚'])/)
    .map(t => t.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Heuristischer POS-Tagger
// ---------------------------------------------------------------------------

/**
 * Schätzt den POS-Tag eines einzelnen Tokens.
 * @param {string} word
 * @param {number} idx  Position im Satz
 * @param {boolean} isFirst  Ist das erste Token im Satz?
 * @param {string} lang  'de' | 'en'
 * @returns {string}  TAG.*
 */
function tagWord(word, idx, isFirst, lang) {
  const w = word.toLowerCase();
  const isDE = lang !== 'en';

  // Punctuation
  if (/^[.,;:!?()\[\]"«»„"‚'—…]+$/.test(word)) return TAG.PUNCT;

  // Subordinating conjunctions (check before CONJ_COORD)
  if (isDE && SUBORDINATING_DE.has(w)) return TAG.CONJ_SUB;
  if (!isDE && SUBORDINATING_EN.has(w)) return TAG.CONJ_SUB;

  // Pronouns
  if (isDE && PRONOUNS_DE.has(w)) return TAG.PRON;
  if (!isDE && PRONOUNS_EN.has(w)) return TAG.PRON;

  // Auxiliaries (check before VERB)
  if (isDE && AUXILIARIES_DE.has(w)) return TAG.AUX;
  if (!isDE && AUXILIARIES_EN.has(w)) return TAG.AUX;

  // Determiners
  if (isDE && DETERMINERS_DE.has(w)) return TAG.DET;
  if (!isDE && DETERMINERS_EN.has(w)) return TAG.DET;

  // Prepositions
  if (isDE && PREPOSITIONS_DE.has(w)) return TAG.PREP;
  if (!isDE && PREPOSITIONS_EN.has(w)) return TAG.PREP;

  // German nouns: capitalized, not sentence-initial (all German nouns are capitalized)
  if (isDE && !isFirst && /^[A-ZÄÖÜ]/.test(word)) return TAG.NOUN;

  // Verb heuristics (German)
  if (isDE) {
    for (const suf of VERB_SUFFIXES_DE) {
      if (w.endsWith(suf) && w.length > suf.length + 1) return TAG.VERB;
    }
  }

  // English verbs: ends in -s, -ed, -ing
  if (!isDE && /(?:s|ed|ing)$/.test(w) && w.length > 3) return TAG.VERB;

  // English nouns: capitalized (but sentence start is less informative in EN)
  if (!isDE && /^[A-Z]/.test(word) && !isFirst) return TAG.NOUN;

  // Adjective heuristics (German -er/-es/-em/-en/-e endings in context)
  if (isDE && /[aeiouyäöü](r|s|m|n|e)$/.test(w) && w.length > 3) return TAG.ADJ;

  // English adjectives: -ful, -less, -ous, -ive, -able, -ible, -al, -ary
  if (!isDE && /(?:ful|less|ous|ive|able|ible|al|ary)$/.test(w)) return TAG.ADJ;

  // Adverbs (German: -lich, -weise, -mals, -lang)
  if (isDE && /(?:lich|weise|mals|lang)$/.test(w)) return TAG.ADV;
  // English adverbs: -ly
  if (!isDE && w.endsWith('ly') && w.length > 3) return TAG.ADV;

  return TAG.OTHER;
}

/**
 * Taggt alle Tokens eines Satzes.
 * @param {string[]} words
 * @param {string} lang
 * @returns {Array<{id: string, text: string, tag: string}>}
 */
function tagTokens(words, lang) {
  let counter = 0;
  return words.map((word, idx) => {
    const isFirst = idx === 0;
    const tag = tagWord(word, idx, isFirst, lang);
    counter += 1;
    return { id: `t${counter}`, text: word, tag };
  });
}

// ---------------------------------------------------------------------------
// Chunker
// ---------------------------------------------------------------------------

let _chunkCounter = 0;

function nextChunkId() {
  _chunkCounter += 1;
  return `c${_chunkCounter}`;
}

// ---------------------------------------------------------------------------
// Binding-Konstruktor
// ---------------------------------------------------------------------------

let _bindingCounter = 0;
function nextBindingId() {
  _bindingCounter += 1;
  return `b${_bindingCounter}`;
}

/**
 * Erstellt ein Binding-Objekt zwischen zwei Chunks.
 *
 * Bindungen sind explizite relationale Objekte — keine Chunk-Attribute.
 * Elastizität gibt an, wie viel Oberflächenverschiebung erlaubt ist,
 * ohne die funktionale Relation zu zerstören (0.0 = starr, 1.0 = sehr elastisch).
 *
 * @param {string} sourceId  - Chunk-ID des Ausgangsobjekts
 * @param {string} targetId  - Chunk-ID des Zielobjekts
 * @param {object} spec      - { type, strength, elasticity, uncertainty }
 * @returns {object}         - Binding-Objekt
 */
function createBinding(sourceId, targetId, spec = {}) {
  return {
    id:          nextBindingId(),
    source:      sourceId,
    target:      targetId,
    type:        spec.type        || 'modification',
    strength:    spec.strength    ?? 0.8,
    elasticity:  spec.elasticity  ?? 0.5,
    uncertainty: spec.uncertainty ?? 0.0,
    committed:   false,
  };
}

/**
 * Baut Chunks aus getaggten Tokens auf und erzeugt explizite Bindungen
 * zwischen den Chunks.
 *
 * Strategie:
 *   1. Finde das finite Verb (VERB oder AUX) → Prädikat-Kern
 *   2. Alles davor: Pronomen oder erste NP → Subjekt
 *   3. Direkt nach dem Prädikat: NP → Objekt
 *   4. Nebensatz (CONJ_SUB + ...) → Relation
 *   5. Präpositionalphrasen → Ornament
 *   6. Adjektive und Adverbien allein → Ornament
 *   7. Rest → Ornament
 *
 * Bindungen werden für jede Chunk-Relation explizit erstellt.
 * Sie sind unabhängige Objekte — nicht Attribute der Chunks.
 *
 * @param {Array<{id,text,tag}>} tokens
 * @param {string} lang
 * @returns {{ chunks: Array<{id,type,tokenIds,text}>, bindings: Array }}
 */
function buildChunks(tokens, lang) {
  const isDE = lang !== 'en';
  const copula = isDE ? COPULA_DE : COPULA_EN;
  const chunks = [];

  // -- 1. Find predicate position (first finite verb or auxiliary) --
  let predStart = -1;
  let predEnd = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].tag === TAG.VERB || tokens[i].tag === TAG.AUX) {
      predStart = i;
      // Gather verb complex (consecutive AUX/VERB tokens, possibly separated by ADV)
      predEnd = i;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].tag === TAG.VERB || tokens[j].tag === TAG.AUX) {
          predEnd = j;
        } else if (tokens[j].tag === TAG.ADV) {
          // Allow adverb within verb complex (e.g., "hat auch gemacht")
          continue;
        } else {
          break;
        }
      }
      break;
    }
  }

  // -- 2. Check if predicate is a copula (state verb) --
  const isCopula =
    predStart !== -1 && copula.has(tokens[predStart].text.toLowerCase());

  // -- 3. Check for subordinate clause --
  let subClauseStart = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].tag === TAG.CONJ_SUB) {
      subClauseStart = i;
      break;
    }
  }

  // Tokens before the subordinate clause (or all if none)
  const mainClauseEnd = subClauseStart !== -1 ? subClauseStart : tokens.length;

  // -- 4. Build subject chunk (tokens before predicate in main clause) --
  if (predStart > 0) {
    // Find the NP before the predicate
    const subjectTokens = [];
    let inNP = false;
    for (let i = 0; i < predStart && i < mainClauseEnd; i++) {
      const t = tokens[i];
      if (t.tag === TAG.PUNCT) continue;
      if (t.tag === TAG.PRON || t.tag === TAG.NOUN || t.tag === TAG.DET || t.tag === TAG.ADJ) {
        subjectTokens.push(t.id);
        inNP = true;
      } else if (inNP && (t.tag === TAG.OTHER || t.tag === TAG.ADV)) {
        // Allow loose words in subject NP
        subjectTokens.push(t.id);
      } else if (inNP) {
        break;
      }
    }
    if (subjectTokens.length > 0) {
      const subjectText = subjectTokens.map(id => tokens.find(t => t.id === id).text).join(' ');
      chunks.push({ id: nextChunkId(), type: 'core.subject', tokenIds: subjectTokens, text: subjectText });
    }
  } else if (predStart === 0 || predStart === -1) {
    // Imperative or verbless: try to find a subject after the verb
  }

  // -- 5. Build predicate chunk --
  if (predStart !== -1) {
    const predTokenIds = [];
    for (let i = predStart; i <= predEnd; i++) {
      if (tokens[i].tag !== TAG.PUNCT) predTokenIds.push(tokens[i].id);
    }
    if (predTokenIds.length > 0) {
      const predText = predTokenIds.map(id => tokens.find(t => t.id === id).text).join(' ');
      const predType = isCopula ? 'state' : 'core.predicate';
      chunks.push({ id: nextChunkId(), type: predType, tokenIds: predTokenIds, text: predText });
    }
  }

  // -- 6. Build object or state complement (tokens after predicate, before subclause) --
  if (predEnd !== -1 && predEnd + 1 < mainClauseEnd) {
    const afterPred = tokens.slice(predEnd + 1, mainClauseEnd);
    const objectTokenIds = [];
    let inObjectNP = false;
    let inPP = false;
    const ornamentTokenIds = [];

    for (let i = 0; i < afterPred.length; i++) {
      const t = afterPred[i];
      if (t.tag === TAG.PUNCT) continue;

      if (t.tag === TAG.PREP) {
        // Prepositional phrase → ornament
        if (objectTokenIds.length > 0 && !inObjectNP) {
          inPP = true;
        }
        ornamentTokenIds.push(t.id);
        continue;
      }

      if (inPP) {
        ornamentTokenIds.push(t.id);
        continue;
      }

      if (t.tag === TAG.DET || t.tag === TAG.NOUN || t.tag === TAG.PRON || t.tag === TAG.ADJ) {
        objectTokenIds.push(t.id);
        inObjectNP = true;
      } else if (inObjectNP && t.tag === TAG.OTHER) {
        objectTokenIds.push(t.id);
      } else {
        ornamentTokenIds.push(t.id);
      }
    }

    if (objectTokenIds.length > 0) {
      const objText = objectTokenIds.map(id => tokens.find(t => t.id === id).text).join(' ');
      const objType = isCopula ? 'state' : 'core.object';
      // If copula already emitted, make this a standalone state chunk
      if (isCopula && chunks.some(c => c.type === 'state')) {
        chunks.push({ id: nextChunkId(), type: 'ornament', tokenIds: objectTokenIds, text: objText });
      } else {
        chunks.push({ id: nextChunkId(), type: objType, tokenIds: objectTokenIds, text: objText });
      }
    }

    if (ornamentTokenIds.length > 0) {
      const ornText = ornamentTokenIds.map(id => tokens.find(t => t.id === id).text).join(' ');
      chunks.push({ id: nextChunkId(), type: 'ornament', tokenIds: ornamentTokenIds, text: ornText });
    }
  }

  // -- 7. Build relation chunk (subordinate clause) --
  if (subClauseStart !== -1) {
    const relTokenIds = tokens.slice(subClauseStart).filter(t => t.tag !== TAG.PUNCT).map(t => t.id);
    if (relTokenIds.length > 0) {
      const relText = relTokenIds.map(id => tokens.find(t => t.id === id).text).join(' ');
      chunks.push({ id: nextChunkId(), type: 'relation', tokenIds: relTokenIds, text: relText });
    }
  }

  // -- 8. If no predicate found, treat everything as ornament --
  if (predStart === -1 && chunks.length === 0) {
    const allIds = tokens.filter(t => t.tag !== TAG.PUNCT).map(t => t.id);
    if (allIds.length > 0) {
      const allText = allIds.map(id => tokens.find(t => t.id === id).text).join(' ');
      chunks.push({ id: nextChunkId(), type: 'ornament', tokenIds: allIds, text: allText });
    }
  }

  // -- 9. Build explicit bindings between chunks --
  // Bindings are first-class objects, not chunk attributes.
  // Elasticity values encode how much surface displacement is structurally
  // acceptable without the functional relation being considered broken.
  const bindings = _buildBindings(chunks);

  return { chunks, bindings };
}

/**
 * Derives explicit Binding objects from a chunk array.
 *
 * Binding defaults per relation type:
 *   subject  → predicate : agreement,   strength 0.95, elasticity 0.15
 *   predicate → object   : modification, strength 0.85, elasticity 0.30
 *   ornament  → predicate: modification, strength 0.55, elasticity 0.70
 *   relation  → predicate: subordination, strength 0.80, elasticity 0.10
 *
 * @param {Array<{id,type,tokenIds,text}>} chunks
 * @returns {Array<Binding>}
 */
function _buildBindings(chunks) {
  const bindings = [];

  const predChunk    = chunks.find(c => c.type === 'core.predicate' || c.type === 'state');
  const subjectChunk = chunks.find(c => c.type === 'core.subject');
  const objectChunk  = chunks.find(c => c.type === 'core.object');
  const relChunks    = chunks.filter(c => c.type === 'relation');
  const ornChunks    = chunks.filter(c => c.type === 'ornament');

  if (predChunk && subjectChunk) {
    bindings.push(createBinding(subjectChunk.id, predChunk.id, {
      type:       'agreement',
      strength:   0.95,
      elasticity: 0.15,
    }));
  }

  if (predChunk && objectChunk) {
    bindings.push(createBinding(predChunk.id, objectChunk.id, {
      type:       'modification',
      strength:   0.85,
      elasticity: 0.30,
    }));
  }

  if (predChunk) {
    for (const orn of ornChunks) {
      // Adjuncts (adverbs, modal particles) have high elasticity:
      // they remain bound to the predicate even when displaced in surface position.
      bindings.push(createBinding(orn.id, predChunk.id, {
        type:       'modification',
        strength:   0.55,
        elasticity: 0.70,
      }));
    }

    for (const rel of relChunks) {
      bindings.push(createBinding(rel.id, predChunk.id, {
        type:       'subordination',
        strength:   0.80,
        elasticity: 0.10,
      }));
    }
  }

  return bindings;
}

// ---------------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------------

/**
 * Zerlegt einen Satz in funktionale Chunks und erzeugt explizite Bindungen.
 *
 * Rückgabe enthält jetzt `bindings` als eigenständiges Array neben `chunks`.
 * Bindungen sind keine Chunk-Attribute — sie sind erste Klasse Objekte.
 *
 * @param {string} sentence  - Ein einzelner Satz
 * @param {string} [lang]    - 'de' (Standard) oder 'en'
 * @returns {{
 *   tokens:   Array<{id: string, text: string, tag: string}>,
 *   chunks:   Array<{id: string, type: string, tokenIds: string[], text: string}>,
 *   bindings: Array<{id, source, target, type, strength, elasticity, uncertainty, committed}>
 * }}
 */
function chunkSentence(sentence, lang = 'de') {
  const resolvedLang = String(lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  const words = tokenizeText(String(sentence || ''));
  if (!words.length) return { tokens: [], chunks: [], bindings: [] };

  const tokens = tagTokens(words, resolvedLang);
  const { chunks, bindings } = buildChunks(tokens, resolvedLang);

  return { tokens, chunks, bindings };
}

/**
 * Zerlegt einen mehrsätzigen Text in Chunk-Strukturen und Bindungen pro Satz.
 *
 * @param {string} text
 * @param {string} [lang]
 * @returns {Array<{sentence: string, tokens: Array, chunks: Array, bindings: Array}>}
 */
function chunkText(text, lang = 'de') {
  const { splitSentences } = require('./clauseDetector');
  const sentences = splitSentences(String(text || ''));
  return sentences.map(sentence => ({
    sentence,
    ...chunkSentence(sentence, lang),
  }));
}

module.exports = {
  chunkSentence,
  chunkText,
  tokenizeText,
  tagTokens,
  TAG,
  PRONOUNS_DE,
  PRONOUNS_EN,
  AUXILIARIES_DE,
  AUXILIARIES_EN,
  SUBORDINATING_DE,
  SUBORDINATING_EN,
  COPULA_DE,
  COPULA_EN,
};
