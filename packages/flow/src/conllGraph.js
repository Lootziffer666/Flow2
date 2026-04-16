'use strict';

function parseFeats(rawFeats) {
  if (!rawFeats || rawFeats === '_') return {};
  return String(rawFeats)
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
}

function parseConllu(conlluText) {
  const lines = String(conlluText || '').split(/\r?\n/);
  const sentences = [];
  let current = [];

  const pushSentence = () => {
    if (!current.length) return;
    sentences.push({ tokens: current });
    current = [];
  };

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) {
      pushSentence();
      continue;
    }
    if (line.startsWith('#')) continue;

    const cols = lineRaw.split('\t');
    if (cols.length < 8) continue;

    const tokenIdRaw = cols[0];
    if (tokenIdRaw.includes('-') || tokenIdRaw.includes('.')) continue;

    const tokenId = Number(tokenIdRaw);
    if (!Number.isFinite(tokenId)) continue;

    current.push({
      id: tokenId,
      form: cols[1] || '',
      lemma: cols[2] || '',
      upos: cols[3] || '',
      xpos: cols[4] || '',
      feats: parseFeats(cols[5] || '_'),
      head: Number(cols[6]) || 0,
      deprel: cols[7] || '',
      deps: cols[8] || '_',
      misc: cols[9] || '_',
    });
  }

  pushSentence();
  return sentences;
}

function buildNodeId(token) {
  const lemma = token.lemma && token.lemma !== '_' ? token.lemma.toLowerCase() : token.form.toLowerCase();
  return `${lemma}::${token.upos || 'X'}`;
}

function buildConllGraph(sentences, options = {}) {
  const windowSize = Math.max(1, Number(options.windowSize || 2));
  const nodeMap = new Map();
  const edges = [];

  const ensureNode = (token) => {
    const nodeId = buildNodeId(token);
    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, {
        id: nodeId,
        lemma: token.lemma || token.form,
        upos: token.upos || 'X',
        forms: new Set([token.form]),
        features: {},
        frequency: 0,
      });
    }
    const node = nodeMap.get(nodeId);
    node.forms.add(token.form);
    node.frequency += 1;
    Object.assign(node.features, token.feats || {});
    return nodeId;
  };

  for (const sentence of sentences || []) {
    const byId = new Map();
    for (const token of sentence.tokens || []) byId.set(token.id, token);

    for (const token of sentence.tokens || []) {
      const nodeId = ensureNode(token);

      if (token.head > 0 && byId.has(token.head)) {
        const headNodeId = ensureNode(byId.get(token.head));
        edges.push({
          source: nodeId,
          target: headNodeId,
          type: 'dependency',
          relation: token.deprel || 'dep',
          weight: 1,
        });
      }
    }

    for (let i = 0; i < sentence.tokens.length; i += 1) {
      const left = sentence.tokens[i];
      const leftNodeId = ensureNode(left);
      for (let j = i + 1; j < sentence.tokens.length && j <= i + windowSize; j += 1) {
        const right = sentence.tokens[j];
        const rightNodeId = ensureNode(right);
        edges.push({
          source: leftNodeId,
          target: rightNodeId,
          type: 'window_cooccurrence',
          relation: `distance_${j - i}`,
          weight: 1 / (j - i),
        });
      }
    }
  }

  const nodes = [...nodeMap.values()].map((node) => ({
    ...node,
    forms: [...node.forms].sort(),
  }));

  return { nodes, edges };
}

function buildConllGraphFromText(conlluText, options = {}) {
  return buildConllGraph(parseConllu(conlluText), options);
}

module.exports = {
  parseConllu,
  buildConllGraph,
  buildConllGraphFromText,
};
