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
  const rawEdges = [];

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
        rawEdges.push({
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
        rawEdges.push({
          source: leftNodeId,
          target: rightNodeId,
          type: 'window_cooccurrence',
          relation: `distance_${j - i}`,
          weight: 1 / (j - i),
        });
      }
    }
  }

  const mergedEdgeMap = new Map();
  for (const edge of rawEdges) {
    const bondId = `${edge.type}:${edge.relation}:${edge.source}->${edge.target}`;
    if (!mergedEdgeMap.has(bondId)) {
      mergedEdgeMap.set(bondId, {
        bond_id: bondId,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        relation: edge.relation,
        weight: 0,
        occurrences: 0,
      });
    }
    const merged = mergedEdgeMap.get(bondId);
    merged.weight += edge.weight;
    merged.occurrences += 1;
  }

  const edges = [...mergedEdgeMap.values()].sort((a, b) => a.bond_id.localeCompare(b.bond_id));

  const nodes = [...nodeMap.values()].map((node) => ({
    ...node,
    forms: [...node.forms].sort(),
  })).sort((a, b) => a.id.localeCompare(b.id));

  return {
    nodes,
    edges,
    relation_stage: 'post_conllu_parse_pre_grammar',
    bond_integrity: {
      raw_edge_count: rawEdges.length,
      merged_edge_count: edges.length,
    },
  };
}

function buildConllGraphFromText(conlluText, options = {}) {
  return buildConllGraph(parseConllu(conlluText), options);
}

function compareBondIntegrity(baseGraph, nextGraph) {
  const baseEdges = new Map((baseGraph?.edges || []).map((edge) => [edge.bond_id, edge]));
  const nextEdges = new Map((nextGraph?.edges || []).map((edge) => [edge.bond_id, edge]));

  const added = [];
  const removed = [];
  const changedWeight = [];

  for (const [bondId, edge] of nextEdges.entries()) {
    if (!baseEdges.has(bondId)) {
      added.push(bondId);
      continue;
    }
    const base = baseEdges.get(bondId);
    if (base.weight !== edge.weight || base.occurrences !== edge.occurrences) {
      changedWeight.push({
        bond_id: bondId,
        base_weight: base.weight,
        next_weight: edge.weight,
        base_occurrences: base.occurrences,
        next_occurrences: edge.occurrences,
      });
    }
  }

  for (const bondId of baseEdges.keys()) {
    if (!nextEdges.has(bondId)) removed.push(bondId);
  }

  return {
    base_bonds: baseEdges.size,
    next_bonds: nextEdges.size,
    added: added.sort(),
    removed: removed.sort(),
    changed_weight: changedWeight.sort((a, b) => a.bond_id.localeCompare(b.bond_id)),
    has_drift: added.length > 0 || removed.length > 0 || changedWeight.length > 0,
  };
}

module.exports = {
  parseConllu,
  buildConllGraph,
  buildConllGraphFromText,
  compareBondIntegrity,
};
