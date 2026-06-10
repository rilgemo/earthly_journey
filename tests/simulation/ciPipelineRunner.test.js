'use strict';

const { runCIPipeline } = require('../../src/simulation/architecture-ci/ciPipelineRunner');

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTrace(modules = []) {
  // Minimal trace object that satisfies ciLiteRunner
  const trace = {};
  for (const mod of modules) trace[mod] = {};
  return trace;
}

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

// ─── API contract ─────────────────────────────────────────────────────────────

describe('runCIPipeline — API contract', () => {
  test('returns ciReport, ir, diff keys', () => {
    const result = runCIPipeline(makeTrace(), null);
    expect(result).toHaveProperty('ciReport');
    expect(result).toHaveProperty('ir');
    expect(result).toHaveProperty('diff');
  });

  test('result is frozen', () => {
    const result = runCIPipeline(makeTrace(), null);
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('diff is null when no prevIR provided', () => {
    const result = runCIPipeline(makeTrace(), null);
    expect(result.diff).toBeNull();
  });

  test('diff is null when prevIR is undefined', () => {
    const result = runCIPipeline(makeTrace(), undefined);
    expect(result.diff).toBeNull();
  });

  test('does not throw on empty trace', () => {
    expect(() => runCIPipeline({}, null)).not.toThrow();
  });

  test('does not throw on null trace', () => {
    expect(() => runCIPipeline(null, null)).not.toThrow();
  });
});

// ─── ciReport shape ───────────────────────────────────────────────────────────

describe('runCIPipeline — ciReport', () => {
  test('ciReport has status field', () => {
    const { ciReport } = runCIPipeline(makeTrace(), null);
    expect(['PASS', 'FAIL']).toContain(ciReport.status);
  });

  test('ciReport has violations array', () => {
    const { ciReport } = runCIPipeline(makeTrace(), null);
    expect(Array.isArray(ciReport.violations)).toBe(true);
  });
});

// ─── IR shape ─────────────────────────────────────────────────────────────────

describe('runCIPipeline — ir', () => {
  test('ir has tick, nodes, edges, violations, meta', () => {
    const { ir } = runCIPipeline(makeTrace(), null);
    expect(ir).toHaveProperty('tick');
    expect(ir).toHaveProperty('nodes');
    expect(ir).toHaveProperty('edges');
    expect(ir).toHaveProperty('violations');
    expect(ir).toHaveProperty('meta');
  });

  test('ir.meta.version is ci-ir-v1', () => {
    const { ir } = runCIPipeline(makeTrace(), null);
    expect(ir.meta.version).toBe('ci-ir-v1');
  });
});

// ─── diff shape ───────────────────────────────────────────────────────────────

describe('runCIPipeline — diff with prevIR', () => {
  test('diff is non-null when prevIR is provided', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    expect(diff).not.toBeNull();
  });

  test('diff has nodes.added, nodes.removed, nodes.layerChanged', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    expect(diff.nodes).toHaveProperty('added');
    expect(diff.nodes).toHaveProperty('removed');
    expect(diff.nodes).toHaveProperty('layerChanged');
  });

  test('diff has edges.added, edges.removed, edges.reversed', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    expect(diff.edges).toHaveProperty('added');
    expect(diff.edges).toHaveProperty('removed');
    expect(diff.edges).toHaveProperty('reversed');
  });

  test('diff has causalDriftScore as number', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    expect(typeof diff.causalDriftScore).toBe('number');
  });

  test('diff has violations array', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    expect(Array.isArray(diff.violations)).toBe(true);
  });

  test('identical consecutive traces produce drift score 0', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    expect(diff.causalDriftScore).toBe(0);
  });

  test('nodes.added contains id strings (not objects)', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    for (const id of diff.nodes.added) {
      expect(typeof id).toBe('string');
    }
  });

  test('edges.reversed entries have from and to string fields', () => {
    const { ir: first } = runCIPipeline(makeTrace(), null);
    const { diff } = runCIPipeline(makeTrace(), first);
    for (const e of diff.edges.reversed) {
      expect(typeof e.from).toBe('string');
      expect(typeof e.to).toBe('string');
    }
  });
});

// ─── pipeline chaining ────────────────────────────────────────────────────────

describe('runCIPipeline — chaining', () => {
  test('chaining two calls: second diff is non-null', () => {
    const r1 = runCIPipeline(makeTrace(), null);
    const r2 = runCIPipeline(makeTrace(), r1.ir);
    expect(r2.diff).not.toBeNull();
  });

  test('chaining three calls: third diff is non-null', () => {
    const r1 = runCIPipeline(makeTrace(), null);
    const r2 = runCIPipeline(makeTrace(), r1.ir);
    const r3 = runCIPipeline(makeTrace(), r2.ir);
    expect(r3.diff).not.toBeNull();
  });

  test('each call returns a new frozen object', () => {
    const r1 = runCIPipeline(makeTrace(), null);
    const r2 = runCIPipeline(makeTrace(), r1.ir);
    expect(r1).not.toBe(r2);
    expect(Object.isFrozen(r1)).toBe(true);
    expect(Object.isFrozen(r2)).toBe(true);
  });
});
