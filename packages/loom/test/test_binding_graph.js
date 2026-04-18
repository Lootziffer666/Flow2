'use strict';

/**
 * Tests für den BindingGraph — den relationalen Layer von LOOM.
 *
 * Diese Tests prüfen NICHT ob Chunks linguistisch korrekt sind,
 * sondern ob die Bindungsstruktur die Architekturvorgaben erfüllt:
 * - Bindungen sind eigenständige Objekte (nicht Chunk-Attribute)
 * - Elastizitätswerte liegen in den spezifizierten Bereichen
 * - Ein Prädikat-Chunk hat immer mindestens eine Bindung
 * - Bindungen sind bidirektional traversierbar
 * - Ein unnormalisiertes LO kann in einer vollständigen Bindungsstruktur eingebettet sein
 */

const { buildBindingGraph, chunkSentence } = require('../src/index.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('PASS:', label);
    passed++;
  } else {
    console.error('FAIL:', label);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// T1: Bindings sind eigenständige Objekte
// ---------------------------------------------------------------------------

const g1 = buildBindingGraph('Er hat das Buch vergessen.', 'de');

assert(Array.isArray(g1.bindings), 'T1.1: bindings ist ein Array');
assert(g1.bindings.length > 0, 'T1.2: mindestens eine Binding vorhanden');

const b = g1.bindings[0];
assert(typeof b.id === 'string' && b.id.length > 0, 'T1.3: Binding hat id');
assert(typeof b.source === 'string', 'T1.4: Binding hat source (Chunk-ID)');
assert(typeof b.target === 'string', 'T1.5: Binding hat target (Chunk-ID)');
assert(typeof b.type === 'string', 'T1.6: Binding hat type');
assert(typeof b.strength === 'number', 'T1.7: Binding hat strength');
assert(typeof b.elasticity === 'number', 'T1.8: Binding hat elasticity');
assert(typeof b.uncertainty === 'number', 'T1.9: Binding hat uncertainty');
assert(typeof b.committed === 'boolean', 'T1.10: Binding hat committed-Flag');

// Bindings sind keine Attribute der Chunks selbst
for (const chunk of g1.chunks) {
  assert(!chunk.bindings, `T1.11: Chunk ${chunk.type} hat kein eingebettetes bindings-Feld`);
}

// ---------------------------------------------------------------------------
// T2: Elastizitätswerte in spezifizierten Bereichen
// ---------------------------------------------------------------------------

for (const binding of g1.bindings) {
  assert(
    binding.elasticity >= 0.0 && binding.elasticity <= 1.0,
    `T2: elasticity ∈ [0,1] für ${binding.type}`
  );
  assert(
    binding.strength >= 0.0 && binding.strength <= 1.0,
    `T2: strength ∈ [0,1] für ${binding.type}`
  );
  assert(
    binding.uncertainty >= 0.0 && binding.uncertainty <= 1.0,
    `T2: uncertainty ∈ [0,1] für ${binding.type}`
  );
}

// ---------------------------------------------------------------------------
// T3: Subjekt→Prädikat hat agreement-Binding mit hoher Stärke und niedriger Elastizität
// ---------------------------------------------------------------------------

const g3 = buildBindingGraph('Ich gehe nach Hause.', 'de');
const subj = g3.chunks.find(c => c.type === 'core.subject');
const pred = g3.chunks.find(c => c.type === 'core.predicate');

assert(subj && pred, 'T3.1: Subjekt und Prädikat erkannt');

if (subj && pred) {
  const agreementBinding = g3.bindings.find(
    b => b.source === subj.id && b.target === pred.id && b.type === 'agreement'
  );
  assert(agreementBinding !== undefined, 'T3.2: Agreement-Binding Subjekt→Prädikat vorhanden');
  if (agreementBinding) {
    assert(agreementBinding.strength >= 0.9, 'T3.3: Agreement-Binding hat hohe Stärke (≥ 0.9)');
    assert(agreementBinding.elasticity <= 0.25, 'T3.4: Agreement-Binding hat niedrige Elastizität (≤ 0.25)');
  }
}

// ---------------------------------------------------------------------------
// T4: Ornament (Adjunkt) hat hohe Elastizität zum Prädikat
// Das ist das Kernanliegen aus dem Ursprungsgedanken:
// ein Adverb bleibt mit dem Verb verknotet, auch wenn es oberflächlich verschoben ist.
// ---------------------------------------------------------------------------

const g4 = buildBindingGraph('Er hat das Buch gestern vergessen.', 'de');
const ornBinding = g4.bindings.find(b => {
  const src = g4.chunks.find(c => c.id === b.source);
  return src && src.type === 'ornament';
});

assert(ornBinding !== undefined, 'T4.1: Binding von Ornament zu Prädikat vorhanden');
if (ornBinding) {
  assert(
    ornBinding.elasticity >= 0.6,
    `T4.2: Ornament→Prädikat hat hohe Elastizität (≥ 0.6), tatsächlich: ${ornBinding.elasticity}`
  );
}

// ---------------------------------------------------------------------------
// T5: Subordinationsklausel hat niedrige Elastizität
// ---------------------------------------------------------------------------

const g5 = buildBindingGraph('Ich glaube, dass er morgen kommt.', 'de');
const relBinding = g5.bindings.find(b => b.type === 'subordination');
assert(relBinding !== undefined, 'T5.1: Subordinations-Binding vorhanden');
if (relBinding) {
  assert(
    relBinding.elasticity <= 0.15,
    `T5.2: Subordination hat niedrige Elastizität (≤ 0.15), tatsächlich: ${relBinding.elasticity}`
  );
}

// ---------------------------------------------------------------------------
// T6: Bidirektionale Traversierbarkeit
// Für jede Binding muss source und target auf existierende Chunks zeigen.
// ---------------------------------------------------------------------------

const g6 = buildBindingGraph('Das Kind spielt im Garten.', 'de');
const chunkIds = new Set(g6.chunks.map(c => c.id));
for (const binding of g6.bindings) {
  assert(
    chunkIds.has(binding.source),
    `T6: binding.source ${binding.source} zeigt auf vorhandenen Chunk`
  );
  assert(
    chunkIds.has(binding.target),
    `T6: binding.target ${binding.target} zeigt auf vorhandenen Chunk`
  );
}

// ---------------------------------------------------------------------------
// T7: chunkSentence gibt bindings zurück (Abwärtskompatibilität der API)
// ---------------------------------------------------------------------------

const r7 = chunkSentence('Sie liest das Buch.', 'de');
assert(Array.isArray(r7.bindings), 'T7.1: chunkSentence gibt bindings zurück');
assert(Array.isArray(r7.chunks), 'T7.2: chunkSentence gibt chunks zurück');
assert(Array.isArray(r7.tokens), 'T7.3: chunkSentence gibt tokens zurück');

// ---------------------------------------------------------------------------
// T8: Leerer Satz führt nicht zu Fehler
// ---------------------------------------------------------------------------

const g8 = buildBindingGraph('', 'de');
assert(Array.isArray(g8.chunks), 'T8.1: leerer Satz → chunks ist Array');
assert(Array.isArray(g8.bindings), 'T8.2: leerer Satz → bindings ist Array');
assert(g8.bindings.length === 0, 'T8.3: leerer Satz → keine Bindings');

// ---------------------------------------------------------------------------
// T9: committed-Flag ist standardmäßig false
// Ein LO (Chunk) mit unnormalisierter Oberfläche kann in einer vollständigen
// Bindungsstruktur eingebettet sein — Normalisierung ist aufgeschoben.
// ---------------------------------------------------------------------------

for (const binding of g1.bindings) {
  assert(
    binding.committed === false,
    `T9: Binding ${binding.id} hat committed=false (Normalisierung noch nicht committed)`
  );
}

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------

console.log(`\n${passed}/${passed + failed} Binding-Graph-Tests bestanden.`);
if (failed > 0) process.exit(1);
