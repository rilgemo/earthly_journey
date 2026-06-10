'use strict';

/**
 * CI Graph Diff Engine v1
 * Computes structural + causal differences between two CI Graph IRs.
 * Pure function — no I/O, no side effects.
 */

const DRIFT_WEIGHT_EDGE  = 0.4;
const DRIFT_WEIGHT_NODE  = 0.4;
const DRIFT_WEIGHT_LAYER = 0.2;

/**
 * compareGraphs(prevIR, nextIR) → DiffIR
 *
 * DiffIR shape:
 * {
 *   fromTick, toTick,
 *   nodeDiff:  { added, removed, layerChanged },
 *   edgeDiff:  { added, removed, reversed },
 *   causalDriftScore: number (0–1),
 *   violations: [{ type, from, to, reason }]
 * }
 */
function compareGraphs(prevIR, nextIR) {
  if (!prevIR || !nextIR) {
    throw new Error('compareGraphs: both prevIR and nextIR are required');
  }

  const prevNodes = _indexNodes(prevIR.nodes || []);
  const nextNodes = _indexNodes(nextIR.nodes || []);
  const prevEdges = _indexEdges(prevIR.edges || []);
  const nextEdges = _indexEdges(nextIR.edges || []);

  const nodeDiff = _diffNodes(prevNodes, nextNodes);
  const edgeDiff = _diffEdges(prevEdges, nextEdges);

  const causalDriftScore = _computeDriftScore(
    prevNodes, nextNodes,
    prevEdges, nextEdges,
    nodeDiff.layerChanged.length
  );

  const violations = _buildViolations(nodeDiff, edgeDiff, causalDriftScore);

  return Object.freeze({
    fromTick: prevIR.tick ?? null,
    toTick:   nextIR.tick ?? null,
    nodeDiff:  Object.freeze(nodeDiff),
    edgeDiff:  Object.freeze(edgeDiff),
    causalDriftScore,
    violations: Object.freeze(violations)
  });
}

// ─── internals ───────────────────────────────────────────────────────────────

function _indexNodes(nodes) {
  const map = new Map();
  for (const n of nodes) map.set(n.id, n);
  return map;
}

function _indexEdges(edges) {
  const set = new Set();
  for (const e of edges) set.add(`${e.from}->${e.to}`);
  return set;
}

function _diffNodes(prevMap, nextMap) {
  const added        = [];
  const removed      = [];
  const layerChanged = [];

  for (const [id, node] of nextMap) {
    if (!prevMap.has(id)) {
      added.push(node);
    } else {
      const prev = prevMap.get(id);
      if (prev.layer !== node.layer) {
        layerChanged.push({ id, from: prev.layer, to: node.layer });
      }
    }
  }

  for (const [id, node] of prevMap) {
    if (!nextMap.has(id)) removed.push(node);
  }

  return { added, removed, layerChanged };
}

function _diffEdges(prevSet, nextSet) {
  const added    = [];
  const removed  = [];
  const reversed = [];

  for (const key of nextSet) {
    if (!prevSet.has(key)) {
      added.push(_parseEdgeKey(key));
      // check if this is a reversal of a previous edge
      const [a, b] = key.split('->');
      const reverseKey = `${b}->${a}`;
      if (prevSet.has(reverseKey)) {
        reversed.push({ was: reverseKey, now: key });
      }
    }
  }

  for (const key of prevSet) {
    if (!nextSet.has(key)) removed.push(_parseEdgeKey(key));
  }

  return { added, removed, reversed };
}

function _parseEdgeKey(key) {
  const [from, to] = key.split('->');
  return { from, to };
}

function _computeDriftScore(prevNodes, nextNodes, prevEdges, nextEdges, layerViolationCount) {
  const totalNodes = Math.max(prevNodes.size, nextNodes.size, 1);
  const totalEdges = Math.max(prevEdges.size, nextEdges.size, 1);

  let nodeChanges = 0;
  for (const id of nextNodes.keys()) {
    if (!prevNodes.has(id)) nodeChanges++;
    else if (prevNodes.get(id).layer !== nextNodes.get(id).layer) nodeChanges++;
  }
  for (const id of prevNodes.keys()) {
    if (!nextNodes.has(id)) nodeChanges++;
  }

  let edgeChanges = 0;
  for (const key of nextEdges) if (!prevEdges.has(key)) edgeChanges++;
  for (const key of prevEdges) if (!nextEdges.has(key)) edgeChanges++;

  const nodeRatio  = Math.min(nodeChanges / totalNodes, 1);
  const edgeRatio  = Math.min(edgeChanges / totalEdges, 1);
  const layerScore = Math.min(layerViolationCount / Math.max(totalNodes, 1), 1);

  const score =
    DRIFT_WEIGHT_EDGE  * edgeRatio +
    DRIFT_WEIGHT_NODE  * nodeRatio +
    DRIFT_WEIGHT_LAYER * layerScore;

  return Math.round(Math.min(score, 1) * 1000) / 1000;
}

function _buildViolations(nodeDiff, edgeDiff, driftScore) {
  const violations = [];

  for (const rev of edgeDiff.reversed) {
    const [fromA, toA] = rev.was.split('->');
    const [fromB, toB] = rev.now.split('->');
    violations.push({
      type:   'CAUSAL_REVERSAL',
      from:   fromA,
      to:     toA,
      reason: `Edge ${fromA}→${toA} reversed to ${fromB}→${toB}`
    });
  }

  for (const lc of nodeDiff.layerChanged) {
    violations.push({
      type:   'LAYER_DRIFT',
      from:   lc.id,
      to:     lc.id,
      reason: `Module "${lc.id}" moved from ${lc.from} to ${lc.to}`
    });
  }

  if (driftScore > 0.6) {
    violations.push({
      type:   'HIGH_DRIFT',
      from:   null,
      to:     null,
      reason: `Causal drift score ${driftScore} exceeds threshold 0.6`
    });
  }

  return violations;
}

module.exports = {
  compareGraphs,
  DRIFT_WEIGHT_EDGE,
  DRIFT_WEIGHT_NODE,
  DRIFT_WEIGHT_LAYER
};
