'use strict';

const { compareGraphs, DRIFT_WEIGHT_EDGE, DRIFT_WEIGHT_NODE, DRIFT_WEIGHT_LAYER } =
  require('../../src/simulation/architecture-ci/ciGraphDiffEngine');

// ─── fixtures ────────────────────────────────────────────────────────────────

function makeIR(tick, nodes = [], edges = []) {
  return {
    tick,
    status: 'PASS',
    nodes:  nodes.map(([id, layer, rank]) => ({ id, layer, rank })),
    edges:  edges.map(([from, to]) => ({ from, to, type: 'CAUSAL_FLOW' })),
    violations: [],
    meta: { version: 'ci-ir-v1', canonicalOrderHash: 'abcdef01', layerSchema: 'DECISION→EXECUTION→OBSERVATION' }
  };
}

const BASE_NODES = [
  ['matingEvents',        'EXECUTION', 1],
  ['reproductionField',   'EXECUTION', 2],
  ['birthSystem',         'EXECUTION', 3],
  ['birthConsistency',    'OBSERVATION', 4]
];

const BASE_EDGES = [
  ['matingEvents',      'reproductionField'],
  ['reproductionField', 'birthSystem'],
  ['birthSystem',       'birthConsistency']
];

// ─── API contract ─────────────────────────────────────────────────────────────

describe('compareGraphs — API contract', () => {
  test('returns required top-level keys', () => {
    const result = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES));
    expect(result).toHaveProperty('fromTick');
    expect(result).toHaveProperty('toTick');
    expect(result).toHaveProperty('nodeDiff');
    expect(result).toHaveProperty('edgeDiff');
    expect(result).toHaveProperty('causalDriftScore');
    expect(result).toHaveProperty('violations');
  });

  test('fromTick and toTick are taken from IR', () => {
    const result = compareGraphs(makeIR(10, BASE_NODES, BASE_EDGES), makeIR(20, BASE_NODES, BASE_EDGES));
    expect(result.fromTick).toBe(10);
    expect(result.toTick).toBe(20);
  });

  test('result is frozen (immutable)', () => {
    const result = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.nodeDiff)).toBe(true);
    expect(Object.isFrozen(result.edgeDiff)).toBe(true);
    expect(Object.isFrozen(result.violations)).toBe(true);
  });

  test('throws if prevIR is null', () => {
    expect(() => compareGraphs(null, makeIR(2, BASE_NODES, BASE_EDGES))).toThrow();
  });

  test('throws if nextIR is null', () => {
    expect(() => compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), null)).toThrow();
  });

  test('does not mutate prevIR', () => {
    const prev = makeIR(1, BASE_NODES, BASE_EDGES);
    const prevCopy = JSON.stringify(prev);
    compareGraphs(prev, makeIR(2, BASE_NODES, BASE_EDGES));
    expect(JSON.stringify(prev)).toBe(prevCopy);
  });

  test('does not mutate nextIR', () => {
    const next = makeIR(2, BASE_NODES, BASE_EDGES);
    const nextCopy = JSON.stringify(next);
    compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), next);
    expect(JSON.stringify(next)).toBe(nextCopy);
  });
});

// ─── identical graphs ─────────────────────────────────────────────────────────

describe('compareGraphs — identical graphs', () => {
  test('no nodes added or removed', () => {
    const { nodeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES));
    expect(nodeDiff.added).toHaveLength(0);
    expect(nodeDiff.removed).toHaveLength(0);
    expect(nodeDiff.layerChanged).toHaveLength(0);
  });

  test('no edges added or removed', () => {
    const { edgeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES));
    expect(edgeDiff.added).toHaveLength(0);
    expect(edgeDiff.removed).toHaveLength(0);
    expect(edgeDiff.reversed).toHaveLength(0);
  });

  test('drift score is 0', () => {
    const { causalDriftScore } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES)
    );
    expect(causalDriftScore).toBe(0);
  });

  test('no violations', () => {
    const { violations } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES)
    );
    expect(violations).toHaveLength(0);
  });
});

// ─── node diff ────────────────────────────────────────────────────────────────

describe('compareGraphs — node diff', () => {
  test('detects added node', () => {
    const nextNodes = [...BASE_NODES, ['lifeSystem', 'EXECUTION', 5]];
    const { nodeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, BASE_EDGES));
    expect(nodeDiff.added).toHaveLength(1);
    expect(nodeDiff.added[0].id).toBe('lifeSystem');
  });

  test('detects removed node', () => {
    const nextNodes = BASE_NODES.filter(([id]) => id !== 'birthConsistency');
    const { nodeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, BASE_EDGES));
    expect(nodeDiff.removed).toHaveLength(1);
    expect(nodeDiff.removed[0].id).toBe('birthConsistency');
  });

  test('detects layer change', () => {
    const nextNodes = BASE_NODES.map(([id, layer, rank]) =>
      id === 'birthConsistency' ? ['birthConsistency', 'EXECUTION', rank] : [id, layer, rank]
    );
    const { nodeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, BASE_EDGES));
    expect(nodeDiff.layerChanged).toHaveLength(1);
    expect(nodeDiff.layerChanged[0]).toEqual({ id: 'birthConsistency', from: 'OBSERVATION', to: 'EXECUTION' });
  });

  test('unchanged node not reported in any diff bucket', () => {
    const { nodeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES));
    const allChanged = [
      ...nodeDiff.added.map(n => n.id),
      ...nodeDiff.removed.map(n => n.id),
      ...nodeDiff.layerChanged.map(n => n.id)
    ];
    expect(allChanged).toHaveLength(0);
  });
});

// ─── edge diff ────────────────────────────────────────────────────────────────

describe('compareGraphs — edge diff', () => {
  test('detects added edge', () => {
    const nextEdges = [...BASE_EDGES, ['matingEvents', 'birthSystem']];
    const { edgeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, nextEdges));
    expect(edgeDiff.added).toHaveLength(1);
    expect(edgeDiff.added[0]).toEqual({ from: 'matingEvents', to: 'birthSystem' });
  });

  test('detects removed edge', () => {
    const nextEdges = BASE_EDGES.filter(([f]) => f !== 'birthSystem');
    const { edgeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, nextEdges));
    expect(edgeDiff.removed).toHaveLength(1);
    expect(edgeDiff.removed[0]).toEqual({ from: 'birthSystem', to: 'birthConsistency' });
  });

  test('detects reversed edge', () => {
    const nextEdges = BASE_EDGES.map(([f, t]) =>
      f === 'matingEvents' && t === 'reproductionField'
        ? ['reproductionField', 'matingEvents']
        : [f, t]
    );
    const { edgeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, nextEdges));
    expect(edgeDiff.reversed).toHaveLength(1);
    expect(edgeDiff.reversed[0].was).toBe('matingEvents->reproductionField');
    expect(edgeDiff.reversed[0].now).toBe('reproductionField->matingEvents');
  });

  test('reversed edge also appears in edgeDiff.added', () => {
    const nextEdges = BASE_EDGES.map(([f, t]) =>
      f === 'matingEvents' && t === 'reproductionField'
        ? ['reproductionField', 'matingEvents']
        : [f, t]
    );
    const { edgeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, nextEdges));
    const addedKeys = edgeDiff.added.map(e => `${e.from}->${e.to}`);
    expect(addedKeys).toContain('reproductionField->matingEvents');
  });
});

// ─── causal drift score ───────────────────────────────────────────────────────

describe('compareGraphs — causalDriftScore', () => {
  test('score is 0 for identical graphs', () => {
    const { causalDriftScore } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES)
    );
    expect(causalDriftScore).toBe(0);
  });

  test('score is between 0 and 1', () => {
    const nextNodes = [['newModule', 'EXECUTION', 1]];
    const { causalDriftScore } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, []));
    expect(causalDriftScore).toBeGreaterThanOrEqual(0);
    expect(causalDriftScore).toBeLessThanOrEqual(1);
  });

  test('score increases with more changes', () => {
    const smallChange = [
      ...BASE_NODES,
      ['newModule', 'EXECUTION', 5]
    ];
    const bigChange = [['onlyOne', 'DECISION', 1]];

    const { causalDriftScore: small } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, smallChange, BASE_EDGES)
    );
    const { causalDriftScore: large } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, bigChange, [])
    );
    expect(large).toBeGreaterThan(small);
  });

  test('score is a number with at most 3 decimal places', () => {
    const { causalDriftScore } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, [])
    );
    expect(typeof causalDriftScore).toBe('number');
    const decimals = (causalDriftScore.toString().split('.')[1] || '').length;
    expect(decimals).toBeLessThanOrEqual(3);
  });
});

// ─── violations ───────────────────────────────────────────────────────────────

describe('compareGraphs — violations', () => {
  test('CAUSAL_REVERSAL violation on reversed edge', () => {
    const nextEdges = BASE_EDGES.map(([f, t]) =>
      f === 'matingEvents' ? ['reproductionField', 'matingEvents'] : [f, t]
    );
    const { violations } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, nextEdges));
    expect(violations.some(v => v.type === 'CAUSAL_REVERSAL')).toBe(true);
  });

  test('LAYER_DRIFT violation on layer change', () => {
    const nextNodes = BASE_NODES.map(([id, layer, rank]) =>
      id === 'birthConsistency' ? ['birthConsistency', 'EXECUTION', rank] : [id, layer, rank]
    );
    const { violations } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, BASE_EDGES));
    expect(violations.some(v => v.type === 'LAYER_DRIFT')).toBe(true);
  });

  test('HIGH_DRIFT violation when score exceeds 0.6', () => {
    const nextNodes = [['onlyOne', 'DECISION', 1]];
    const { violations } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, []));
    expect(violations.some(v => v.type === 'HIGH_DRIFT')).toBe(true);
  });

  test('no HIGH_DRIFT violation for small change', () => {
    const nextNodes = [...BASE_NODES, ['extraModule', 'EXECUTION', 5]];
    const { violations } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, nextNodes, BASE_EDGES));
    expect(violations.some(v => v.type === 'HIGH_DRIFT')).toBe(false);
  });

  test('violation objects have required shape', () => {
    const nextEdges = BASE_EDGES.map(([f, t]) =>
      f === 'matingEvents' ? ['reproductionField', 'matingEvents'] : [f, t]
    );
    const { violations } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, nextEdges));
    for (const v of violations) {
      expect(v).toHaveProperty('type');
      expect(v).toHaveProperty('from');
      expect(v).toHaveProperty('to');
      expect(v).toHaveProperty('reason');
    }
  });

  test('no violations for stable graphs', () => {
    const { violations } = compareGraphs(
      makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, BASE_NODES, BASE_EDGES)
    );
    expect(violations).toHaveLength(0);
  });
});

// ─── empty graph edge cases ───────────────────────────────────────────────────

describe('compareGraphs — empty graph edge cases', () => {
  test('both empty graphs → drift 0, no violations', () => {
    const { causalDriftScore, violations } = compareGraphs(makeIR(1, [], []), makeIR(2, [], []));
    expect(causalDriftScore).toBe(0);
    expect(violations).toHaveLength(0);
  });

  test('prev empty, next has nodes → all added', () => {
    const { nodeDiff } = compareGraphs(makeIR(1, [], []), makeIR(2, BASE_NODES, BASE_EDGES));
    expect(nodeDiff.added).toHaveLength(BASE_NODES.length);
    expect(nodeDiff.removed).toHaveLength(0);
  });

  test('prev has nodes, next empty → all removed', () => {
    const { nodeDiff } = compareGraphs(makeIR(1, BASE_NODES, BASE_EDGES), makeIR(2, [], []));
    expect(nodeDiff.removed).toHaveLength(BASE_NODES.length);
    expect(nodeDiff.added).toHaveLength(0);
  });

  test('missing nodes array in IR treated as empty', () => {
    const ir1 = makeIR(1, BASE_NODES, BASE_EDGES);
    const ir2 = { ...makeIR(2), nodes: undefined, edges: undefined };
    expect(() => compareGraphs(ir1, ir2)).not.toThrow();
  });
});

// ─── drift weight constants ───────────────────────────────────────────────────

describe('drift weight constants', () => {
  test('weights sum to 1.0', () => {
    const total = DRIFT_WEIGHT_EDGE + DRIFT_WEIGHT_NODE + DRIFT_WEIGHT_LAYER;
    expect(total).toBeCloseTo(1.0, 10);
  });
});
