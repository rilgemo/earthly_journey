//
// CI Graph IR Generator v1
//
// Pure transformation: ciLiteReport → CI Graph IR artifact
//
// Takes the output of runCILite() and produces a standardised Intermediate
// Representation suitable for JSON serialisation, git diff, and VSCode overlay.
//
// No runtime coupling. No file I/O. No simulation state access.
// input(ciLiteReport) → output(IRObject)
//

const { CANONICAL_ORDER, MODULE_LAYER, CANONICAL_RANK } = require('./ciLiteRunner');

const IR_VERSION = 'ci-ir-v1';
const LAYER_SCHEMA = 'DECISION→EXECUTION→OBSERVATION';
const EDGE_TYPE_CAUSAL_FLOW = 'CAUSAL_FLOW';

// ─── Canonical order hash ─────────────────────────────────────────────────────
// Deterministic fingerprint of the CANONICAL_ORDER array.
// Changes if modules are added, removed, or reordered — signals a schema version bump.

function computeCanonicalOrderHash(order) {
  const str = order.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const CANONICAL_ORDER_HASH = computeCanonicalOrderHash(CANONICAL_ORDER);

// ─── Node transformation ──────────────────────────────────────────────────────
// ciLiteRunner node: { id, layer, canonicalRank }
// IR node:          { id, layer, rank }

function transformNode(node) {
  return {
    id: node.id,
    layer: node.layer,
    rank: node.canonicalRank ?? CANONICAL_RANK[node.id] ?? null
  };
}

// ─── Edge transformation ──────────────────────────────────────────────────────
// ciLiteRunner edge: { from, to }
// IR edge:           { from, to, type: "CAUSAL_FLOW" }

function transformEdge(edge) {
  return {
    from: edge.from,
    to: edge.to,
    type: EDGE_TYPE_CAUSAL_FLOW
  };
}

// ─── Violation pass-through ───────────────────────────────────────────────────
// Violations already conform to { type, from, to, reason }.
// Pass through unchanged — no transformation needed.

function transformViolation(violation) {
  return {
    type: violation.type,
    from: violation.from,
    to: violation.to,
    reason: violation.reason
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

function generateCIGraphIR(ciLiteReport) {
  if (!ciLiteReport || typeof ciLiteReport !== 'object') {
    return {
      tick: null,
      status: 'PASS',
      nodes: [],
      edges: [],
      violations: [],
      meta: {
        version: IR_VERSION,
        canonicalOrderHash: CANONICAL_ORDER_HASH,
        layerSchema: LAYER_SCHEMA
      }
    };
  }

  const graph = ciLiteReport.graph || {};
  const nodes = Array.isArray(graph.nodes) ? graph.nodes.map(transformNode) : [];
  const edges = Array.isArray(graph.edges) ? graph.edges.map(transformEdge) : [];
  const violations = Array.isArray(ciLiteReport.violations)
    ? ciLiteReport.violations.map(transformViolation)
    : [];

  return {
    tick: ciLiteReport.tick ?? null,
    status: ciLiteReport.status === 'FAIL' ? 'FAIL' : 'PASS',
    nodes,
    edges,
    violations,
    meta: {
      version: IR_VERSION,
      canonicalOrderHash: CANONICAL_ORDER_HASH,
      layerSchema: LAYER_SCHEMA
    }
  };
}

module.exports = { generateCIGraphIR, IR_VERSION, CANONICAL_ORDER_HASH, LAYER_SCHEMA };
