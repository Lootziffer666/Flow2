/**
 * SPIN UI — Rendering, Workbench, Toast-System
 *
 * Verantwortlich für:
 * - Chunk-Darstellung im DOM
 * - Drag & Drop (SortableJS)
 * - Re-Linearisierung
 * - Diagnose-Anzeige
 * - Toast-Benachrichtigungen
 */

import { CHUNK_TYPES, DOGMA_RULES } from './config.js';
import { runDiagnosis, getChunkText } from './diagnosis.js';
import { earcon } from './earcons.js';
import { detectClauses } from '@loot/loom';

let tokens = [];
let chunks = [];
let originalTokenOrder = '';
let sortableInstance = null;

const container = () => document.getElementById('chunk-container');
const inputEl = () => document.getElementById('sentence-input');

/**
 * Initialisiert SPIN — bindet Event-Listener.
 */
export function initSpin() {
  const input = inputEl();
  const renderBtn = document.getElementById('render-btn');

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      earcon.jingle();
      parseSentence(input.value.trim());
    }
  });

  renderBtn.addEventListener('click', performReRender);
}

/**
 * Zerlegt einen Satz in Tokens und erstellt Chunks.
 * Führt optional eine Grammatik-Analyse via clauseDetector durch.
 * @param {string} sentence
 */
export function parseSentence(sentence) {
  const clauseAnalysis = detectClauses(sentence, 'de');

  const words = sentence.replace(/,/g, '').split(/\s+/).filter(w => w.length > 0);
  tokens = words.map((w, i) => ({ id: `t-${i}`, text: w }));
  originalTokenOrder = tokens.map(t => t.text).sort().join('|');
  chunks = tokens.map((t, i) => ({
    id: `c-${i}`,
    type: 'ornament',
    _initialType: 'ornament',
    tokenIds: [t.id],
    initialOrder: i,
  }));

  displayClauseInfo(clauseAnalysis);

  document.getElementById('output-area').classList.add('hidden');
  initWorkbench();
}

/**
 * Zeigt die Ergebnisse der Clause-Analyse an.
 * @param {object} analysis - Rückgabe von detectClauses()
 */
function displayClauseInfo(analysis) {
  const infoEl = document.getElementById('clause-info');
  if (!infoEl || !analysis || analysis.sentences.length === 0) return;

  const sentence = analysis.sentences[0];
  const parts = [];

  if (sentence.complexity !== 'simple') {
    parts.push(`Satzkomplexität: ${sentence.complexity}`);
  }

  if (sentence.subordinateClauses.length > 0) {
    const conjs = sentence.subordinateClauses.map(c => c.conjunction).join(', ');
    parts.push(`Nebensatz-Konjunktionen: ${conjs}`);
  }

  if (sentence.coordinatingJunctions.length > 0) {
    parts.push(`Beiordnende Konjunktionen: ${sentence.coordinatingJunctions.join(', ')}`);
  }

  if (parts.length > 0) {
    infoEl.textContent = parts.join(' · ');
    infoEl.classList.remove('hidden');
  } else {
    infoEl.textContent = '';
    infoEl.classList.add('hidden');
  }
}

function initWorkbench() {
  renderChunksInDOM();
  document.getElementById('workbench').classList.remove('hidden');
  const containerEl = container();
  if (!sortableInstance && typeof Sortable !== 'undefined') {
    sortableInstance = new Sortable(containerEl, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onMove: validateMove,
    });
  }
}

function validateMove(evt) {
  const containerEl = container();
  const draggedChunk = chunks.find(c => c.id === evt.dragged.dataset.chunkId);
  const currentChunks = Array.from(containerEl.children)
    .map(el => chunks.find(c => c.id === el.dataset.chunkId));

  const realIdx = Array.from(containerEl.children).indexOf(evt.related);
  if (realIdx === -1) return true;

  const violatedRule = DOGMA_RULES.find(
    rule => rule.from === draggedChunk.type && rule.condition(realIdx, currentChunks)
  );

  if (violatedRule) {
    earcon.zerbroseln();
    showToast(violatedRule.reason);
    return false;
  }
  return true;
}

function renderChunksInDOM() {
  const containerEl = container();
  containerEl.innerHTML = '';
  chunks.forEach(chunk => {
    const el = document.createElement('div');
    el.className = `chunk shadow-sm border-b-2 p-3 flex flex-col gap-2 ${
      chunk.type.startsWith('core') ? 'border-black' : 'border-gray-200'
    }`;
    el.dataset.chunkId = chunk.id;

    const label = document.createElement('span');
    label.className = 'font-medium text-lg';
    label.textContent = chunk.tokenIds
      .map(tId => tokens.find(t => t.id === tId).text)
      .join(' ');

    const select = document.createElement('select');
    select.className =
      'text-[10px] uppercase tracking-tighter bg-transparent outline-none text-gray-400 focus:text-black cursor-pointer';
    CHUNK_TYPES.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type.replace('core.', '').replace('evaluation.', '').replace('judgement.', '');
      if (chunk.type === type) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      chunk.type = e.target.value;
      renderChunksInDOM();
    });

    el.appendChild(label);
    el.appendChild(select);
    containerEl.appendChild(el);
  });
}

function performReRender() {
  const containerEl = container();
  const currentOrderIds = Array.from(containerEl.children).map(el => el.dataset.chunkId);
  const hasOrderChanged = currentOrderIds.some(
    (id, index) => chunks.find(c => c.id === id).initialOrder !== index
  );
  const hasTypeChanged = chunks.some(c => c.type !== c._initialType);

  if (!hasOrderChanged && !hasTypeChanged) return;

  const newOrderedChunks = currentOrderIds.map(id => chunks.find(c => c.id === id));
  newOrderedChunks.forEach((chunk, index) => {
    chunk.initialOrder = index;
    chunk._initialType = chunk.type;
  });

  const hasPredicate = newOrderedChunks.some(c => c.type === 'core.predicate');
  if (!hasPredicate) {
    earcon.zerbroseln();
    displayDiagnosis({
      state: 'nicht_renderbar',
      note: 'Kein Prädikatskern vorhanden. Rekonstruktion nicht möglich.',
    });
    document.getElementById('rendered-sentence').textContent = '';
    document.getElementById('output-area').classList.remove('hidden');
    return;
  }

  const renderedTokens = newOrderedChunks.flatMap(c =>
    c.tokenIds.map(tId => tokens.find(t => t.id === tId).text)
  );

  if (originalTokenOrder !== [...renderedTokens].sort().join('|')) {
    earcon.zerbroseln();
    displayDiagnosis({
      state: 'nicht_renderbar',
      note: 'Token-Invarianz verletzt. Rekonstruktion abgebrochen.',
    });
    document.getElementById('rendered-sentence').textContent = '';
    document.getElementById('output-area').classList.remove('hidden');
    return;
  }

  document.getElementById('rendered-sentence').textContent = renderedTokens.join(' ');
  displayDiagnosis(runDiagnosis(newOrderedChunks, tokens));
  earcon.whoosh();
  document.getElementById('output-area').classList.remove('hidden');
}

function displayDiagnosis(diag) {
  const tag = document.getElementById('diagnosis-tag');
  tag.textContent = diag.state.replace(/_/g, ' ');
  tag.className = `inline-block px-3 py-1 text-xs font-mono uppercase border rounded-full diagnosis-${diag.state}`;
  document.getElementById('diagnosis-notes').innerHTML = `<li>${diag.note}</li>`;
}

function showToast(msg) {
  let toast = document.getElementById('spin-toast') || document.createElement('div');
  toast.id = 'spin-toast';
  toast.className =
    'fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white border border-black text-[10px] uppercase tracking-widest shadow-xl transition-opacity duration-500 z-50';
  document.body.appendChild(toast);
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
  }, 2500);
}
