//
// CI v1 Lite — Causal DAG Validator (final form)
//
// Pure static analyzer: input(trace) → output(report)
// Reads only structural execution presence from trace.current.
// Never inspects business logic, agent state, biology, or probability values.
//
// Three violation types only:
//   CYCLE          — back-edge detected in the causal graph
//   FORBIDDEN_EDGE — edge crosses a boundary banned by AGENTS.md §6
//   LAYER_BREAK    — edge reverses the canonical layer hierarchy
//

// ─── Canonical execution order ────────────────────────────────────────────────
// Derived from tickManager.js trace emission sequence.
// Each entry is the exact key written to traceCollector.current.
const CANONICAL_ORDER = Object.freeze([
  'matingEvents',           // B.5  Mating Event System
  'reproductionField',      // C    Reproduction Probability Field
  'resourceFlow',           // –    Resource Flow
  'fieldDynamics',          // –    Field Dynamics
  'coupledEmergence',       // –    Coupled Emergence
  'stability',              // –    Stability Controller
  'reproductionEvents',     // D    Reproduction Event Engine
  'reproductionCommitment', // E    Commitment Boundary
  'life',                   // –    Death Finalization
  'birthSystem',            // F    Birth System
  'birthConsistency'        // G    Birth Consistency Contract (observation)
]);

// ─── Layer assignments ────────────────────────────────────────────────────────
// Based on AGENTS.md §2 authority matrix.
const MODULE_LAYER = Object.freeze({
  matingEvents:           'EXECUTION',
  reproductionField:      'EXECUTION',
  resourceFlow:           'EXECUTION',
  fieldDynamics:          'EXECUTION',
  coupledEmergence:       'EXECUTION',
  stability:              'EXECUTION',
  reproductionEvents:     'EXECUTION',
  reproductionCommitment: 'EXECUTION',
  life:                   'EXECUTION',
  birthSystem:            'EXECUTION',
  birthConsistency:       'OBSERVATION'
});

// ─── Layer hierarchy rank ─────────────────────────────────────────────────────
// Causal flow must go: DECISION(0) → EXECUTION(1) → OBSERVATION(2)
// A LAYER_BREAK fires when an edge's source rank > target rank.
const LAYER_RANK = Object.freeze({
  DECISION:    0,
  EXECUTION:   1,
  OBSERVATION: 2
});

// ─── Forbidden cross-layer edge directions ────────────────────────────────────
// Source: AGENTS.md §6 architectural red flags.
// Each entry: [sourceLayer, targetLayer] — this directed edge type is forbidden.
const FORBIDDEN_DIRECTIONS = Object.freeze([
  ['OBSERVATION', 'EXECUTION'],
  ['OBSERVATION', 'DECISION'],
  ['EXECUTION',   'DECISION']
]);

// ─── Canonical rank index ─────────────────────────────────────────────────────
const CANONICAL_RANK = Object.freeze(
  Object.fromEntries(CANONICAL_ORDER.map((name, index) => [name, index]))
);

// ─── Graph construction ───────────────────────────────────────────────────────

function extractNodes(current) {
  return CANONICAL_ORDER.filter(name => name in current);
}

function buildEdges(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({ from: nodes[i], to: nodes[i + 1] });
  }
  return edges;
}

// ─── Cycle detection (DFS three-color) ───────────────────────────────────────

function detectCycles(nodes, edges) {
  const adjacency = new Map(nodes.map(n => [n, []]));
  for (const { from, to } of edges) {
    if (adjacency.has(from)) adjacency.get(from).push(to);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(nodes.map(n => [n, WHITE]));
  const violations = [];

  function dfs(node) {
    color.set(node, GRAY);
    for (const neighbor of (adjacency.get(node) || [])) {
      if (color.get(neighbor) === GRAY) {
        violations.push({
          type: 'CYCLE',
          from: node,
          to: neighbor,
          reason: `Back-edge detected: "${node}" → "${neighbor}" creates a causal cycle`
        });
        return;
      }
      if (color.get(neighbor) === WHITE) dfs(neighbor);
    }
    color.set(node, BLACK);
  }

  for (const node of nodes) {
    if (color.get(node) === WHITE) dfs(node);
  }

  return violations;
}

// ─── Forbidden edge detection ─────────────────────────────────────────────────

function detectForbiddenEdges(edges) {
  return edges.reduce((acc, { from, to }) => {
    const srcLayer = MODULE_LAYER[from];
    const dstLayer = MODULE_LAYER[to];
    if (!srcLayer || !dstLayer) return acc;
    const forbidden = FORBIDDEN_DIRECTIONS.some(
      ([fs, fd]) => srcLayer === fs && dstLayer === fd
    );
    if (forbidden) {
      acc.push({
        type: 'FORBIDDEN_EDGE',
        from,
        to,
        reason: `${srcLayer} layer "${from}" → ${dstLayer} layer "${to}" is explicitly forbidden by AGENTS.md §6`
      });
    }
    return acc;
  }, []);
}

// ─── Layer break detection ────────────────────────────────────────────────────
// Fires when an edge reverses the causal layer hierarchy:
// source.layerRank > target.layerRank

function detectLayerBreaks(edges) {
  return edges.reduce((acc, { from, to }) => {
    const srcLayer = MODULE_LAYER[from];
    const dstLayer = MODULE_LAYER[to];
    if (!srcLayer || !dstLayer) return acc;
    const srcRank = LAYER_RANK[srcLayer];
    const dstRank = LAYER_RANK[dstLayer];
    if (srcRank !== undefined && dstRank !== undefined && srcRank > dstRank) {
      acc.push({
        type: 'LAYER_BREAK',
        from,
        to,
        reason: `Layer hierarchy reversed: ${srcLayer}(rank=${srcRank}) "${from}" → ${dstLayer}(rank=${dstRank}) "${to}"`
      });
    }
    return acc;
  }, []);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

function runCILite(trace) {
  const current = trace && typeof trace === 'object' ? (trace.current || null) : null;
  const tick = (current && typeof current.tickId === 'number') ? current.tickId : null;

  if (!current || typeof current !== 'object') {
    return { status: 'PASS', tick, graph: { nodes: [], edges: [] }, violations: [] };
  }

  const nodes = extractNodes(current);
  const edges = buildEdges(nodes);

  const violations = [
    ...detectCycles(nodes, edges),
    ...detectForbiddenEdges(edges),
    ...detectLayerBreaks(edges)
  ];

  return {
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    tick,
    graph: {
      nodes: nodes.map(name => ({
        id: name,
        layer: MODULE_LAYER[name] || 'UNKNOWN',
        canonicalRank: CANONICAL_RANK[name] ?? null
      })),
      edges: edges.map(({ from, to }) => ({ from, to }))
    },
    violations
  };
}

module.exports = { runCILite, CANONICAL_ORDER, MODULE_LAYER, CANONICAL_RANK, LAYER_RANK };
