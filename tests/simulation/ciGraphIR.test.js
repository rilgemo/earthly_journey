const { runCILite, CANONICAL_ORDER, MODULE_LAYER, CANONICAL_RANK } = require('../../src/simulation/architecture-ci/ciLiteRunner');
const { generateCIGraphIR, IR_VERSION, CANONICAL_ORDER_HASH, LAYER_SCHEMA } = require('../../src/simulation/architecture-ci/ciGraphIR');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function traceWith(keys, tickId = 1) {
  const current = { tickId };
  for (const k of keys) current[k] = {};
  return { current };
}

function fullCIReport(tickId = 5) {
  return runCILite(traceWith([...CANONICAL_ORDER], tickId));
}

function emptyCIReport() {
  return runCILite(null);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CI Graph IR Generator v1', () => {

  // ── Output shape ──────────────────────────────────────────────────────────────

  describe('output shape', () => {
    test('top-level keys: tick, status, nodes, edges, violations, meta', () => {
      const ir = generateCIGraphIR(fullCIReport());
      expect(ir).toHaveProperty('tick');
      expect(ir).toHaveProperty('status');
      expect(ir).toHaveProperty('nodes');
      expect(ir).toHaveProperty('edges');
      expect(ir).toHaveProperty('violations');
      expect(ir).toHaveProperty('meta');
    });

    test('meta has version, canonicalOrderHash, layerSchema', () => {
      const { meta } = generateCIGraphIR(fullCIReport());
      expect(meta).toHaveProperty('version');
      expect(meta).toHaveProperty('canonicalOrderHash');
      expect(meta).toHaveProperty('layerSchema');
    });

    test('meta.version is IR_VERSION', () => {
      expect(generateCIGraphIR(fullCIReport()).meta.version).toBe(IR_VERSION);
    });

    test('meta.layerSchema is DECISION→EXECUTION→OBSERVATION', () => {
      expect(generateCIGraphIR(fullCIReport()).meta.layerSchema).toBe('DECISION→EXECUTION→OBSERVATION');
    });

    test('nodes is array of objects with id, layer, rank', () => {
      const { nodes } = generateCIGraphIR(fullCIReport());
      expect(Array.isArray(nodes)).toBe(true);
      for (const node of nodes) {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('layer');
        expect(node).toHaveProperty('rank');
      }
    });

    test('IR node uses "rank" not "canonicalRank"', () => {
      const { nodes } = generateCIGraphIR(fullCIReport());
      for (const node of nodes) {
        expect(node).not.toHaveProperty('canonicalRank');
        expect(typeof node.rank).toBe('number');
      }
    });

    test('edges is array of objects with from, to, type', () => {
      const { edges } = generateCIGraphIR(fullCIReport());
      expect(Array.isArray(edges)).toBe(true);
      for (const edge of edges) {
        expect(edge).toHaveProperty('from');
        expect(edge).toHaveProperty('to');
        expect(edge).toHaveProperty('type');
      }
    });

    test('all edge types are CAUSAL_FLOW', () => {
      const { edges } = generateCIGraphIR(fullCIReport());
      for (const edge of edges) {
        expect(edge.type).toBe('CAUSAL_FLOW');
      }
    });

    test('violations is array with type, from, to, reason', () => {
      const ir = generateCIGraphIR(fullCIReport());
      expect(Array.isArray(ir.violations)).toBe(true);
      // verify shape contract even when empty
      if (ir.violations.length > 0) {
        for (const v of ir.violations) {
          expect(v).toHaveProperty('type');
          expect(v).toHaveProperty('from');
          expect(v).toHaveProperty('to');
          expect(v).toHaveProperty('reason');
        }
      }
    });

    test('status is PASS or FAIL only', () => {
      expect(['PASS', 'FAIL']).toContain(generateCIGraphIR(fullCIReport()).status);
      expect(['PASS', 'FAIL']).toContain(generateCIGraphIR(emptyCIReport()).status);
    });
  });

  // ── Tick propagation ──────────────────────────────────────────────────────────

  describe('tick propagation', () => {
    test('tick in IR matches tick in ciLiteReport', () => {
      const report = runCILite(traceWith([...CANONICAL_ORDER], 42));
      expect(generateCIGraphIR(report).tick).toBe(42);
    });

    test('tick is null when ciLiteReport has null tick', () => {
      expect(generateCIGraphIR(emptyCIReport()).tick).toBeNull();
    });
  });

  // ── Status propagation ────────────────────────────────────────────────────────

  describe('status propagation', () => {
    test('PASS report produces PASS IR', () => {
      expect(generateCIGraphIR(fullCIReport()).status).toBe('PASS');
    });

    test('null input produces PASS IR', () => {
      expect(generateCIGraphIR(null).status).toBe('PASS');
    });

    test('undefined input produces PASS IR', () => {
      expect(generateCIGraphIR(undefined).status).toBe('PASS');
    });
  });

  // ── Node transformation ───────────────────────────────────────────────────────

  describe('node transformation', () => {
    test('IR node rank matches CANONICAL_RANK for every module', () => {
      const { nodes } = generateCIGraphIR(fullCIReport());
      for (const node of nodes) {
        expect(node.rank).toBe(CANONICAL_RANK[node.id]);
      }
    });

    test('IR node layer matches MODULE_LAYER for every module', () => {
      const { nodes } = generateCIGraphIR(fullCIReport());
      for (const node of nodes) {
        expect(node.layer).toBe(MODULE_LAYER[node.id]);
      }
    });

    test('node count matches number of canonical keys present in trace', () => {
      const keys = ['matingEvents', 'reproductionField', 'resourceFlow'];
      const report = runCILite(traceWith(keys));
      expect(generateCIGraphIR(report).nodes).toHaveLength(keys.length);
    });

    test('birthConsistency node has layer OBSERVATION', () => {
      const report = runCILite(traceWith([...CANONICAL_ORDER]));
      const ir = generateCIGraphIR(report);
      const node = ir.nodes.find(n => n.id === 'birthConsistency');
      expect(node.layer).toBe('OBSERVATION');
    });
  });

  // ── Edge transformation ───────────────────────────────────────────────────────

  describe('edge transformation', () => {
    test('IR edges preserve from/to from ciLiteReport', () => {
      const report = runCILite(traceWith(['matingEvents', 'reproductionField', 'resourceFlow']));
      const { edges } = generateCIGraphIR(report);
      expect(edges[0].from).toBe('matingEvents');
      expect(edges[0].to).toBe('reproductionField');
      expect(edges[1].from).toBe('reproductionField');
      expect(edges[1].to).toBe('resourceFlow');
    });

    test('IR adds type CAUSAL_FLOW to every edge', () => {
      const report = runCILite(traceWith([...CANONICAL_ORDER]));
      const { edges } = generateCIGraphIR(report);
      expect(edges.every(e => e.type === 'CAUSAL_FLOW')).toBe(true);
    });

    test('edge count equals number of canonical adjacent pairs present', () => {
      const keys = ['matingEvents', 'reproductionField', 'resourceFlow'];
      const report = runCILite(traceWith(keys));
      expect(generateCIGraphIR(report).edges).toHaveLength(keys.length - 1);
    });

    test('single node produces no edges', () => {
      const report = runCILite(traceWith(['matingEvents']));
      expect(generateCIGraphIR(report).edges).toHaveLength(0);
    });
  });

  // ── Violation pass-through ────────────────────────────────────────────────────

  describe('violation pass-through', () => {
    test('violations are preserved from ciLiteReport', () => {
      const report = fullCIReport();
      const ir = generateCIGraphIR(report);
      expect(ir.violations).toHaveLength(report.violations.length);
    });

    test('violation fields type, from, to, reason are preserved', () => {
      const fakeReport = {
        tick: 1,
        status: 'FAIL',
        graph: { nodes: [], edges: [] },
        violations: [{
          type: 'CYCLE',
          from: 'moduleA',
          to: 'moduleB',
          reason: 'back-edge'
        }]
      };
      const ir = generateCIGraphIR(fakeReport);
      expect(ir.violations[0]).toEqual({
        type: 'CYCLE',
        from: 'moduleA',
        to: 'moduleB',
        reason: 'back-edge'
      });
    });

    test('FAIL status is propagated when violations exist', () => {
      const fakeReport = {
        tick: 1,
        status: 'FAIL',
        graph: { nodes: [], edges: [] },
        violations: [{ type: 'CYCLE', from: 'a', to: 'b', reason: 'x' }]
      };
      expect(generateCIGraphIR(fakeReport).status).toBe('FAIL');
    });
  });

  // ── Meta / canonicalOrderHash ─────────────────────────────────────────────────

  describe('meta — canonicalOrderHash', () => {
    test('canonicalOrderHash is a non-empty hex string', () => {
      const hash = generateCIGraphIR(fullCIReport()).meta.canonicalOrderHash;
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    test('canonicalOrderHash is stable across calls', () => {
      const a = generateCIGraphIR(fullCIReport()).meta.canonicalOrderHash;
      const b = generateCIGraphIR(fullCIReport()).meta.canonicalOrderHash;
      expect(a).toBe(b);
    });

    test('exported CANONICAL_ORDER_HASH matches IR meta hash', () => {
      expect(generateCIGraphIR(fullCIReport()).meta.canonicalOrderHash).toBe(CANONICAL_ORDER_HASH);
    });

    test('LAYER_SCHEMA export matches meta.layerSchema', () => {
      expect(generateCIGraphIR(fullCIReport()).meta.layerSchema).toBe(LAYER_SCHEMA);
    });
  });

  // ── Pure function / immutability ──────────────────────────────────────────────

  describe('pure function — no side effects', () => {
    test('does not mutate the ciLiteReport input', () => {
      const report = fullCIReport();
      const before = JSON.stringify(report);
      generateCIGraphIR(report);
      expect(JSON.stringify(report)).toBe(before);
    });

    test('identical inputs produce identical outputs', () => {
      const report = fullCIReport(7);
      expect(generateCIGraphIR(report)).toEqual(generateCIGraphIR(report));
    });

    test('does not throw for any input type', () => {
      for (const input of [null, undefined, 0, '', [], {}, fullCIReport()]) {
        expect(() => generateCIGraphIR(input)).not.toThrow();
      }
    });

    test('output is JSON-serialisable', () => {
      const ir = generateCIGraphIR(fullCIReport());
      expect(() => JSON.stringify(ir)).not.toThrow();
      expect(typeof JSON.stringify(ir)).toBe('string');
    });

    test('returned IR is not a reference to input report', () => {
      const report = fullCIReport();
      const ir = generateCIGraphIR(report);
      ir.nodes.push({ id: 'injected' });
      expect(generateCIGraphIR(report).nodes.find(n => n.id === 'injected')).toBeUndefined();
    });
  });

  // ── Full pipeline: ciLiteRunner → ciGraphIR ───────────────────────────────────

  describe('full pipeline integration', () => {
    test('pipeline over full trace produces PASS IR with all canonical nodes', () => {
      const report = runCILite(traceWith([...CANONICAL_ORDER], 99));
      const ir = generateCIGraphIR(report);
      expect(ir.status).toBe('PASS');
      expect(ir.tick).toBe(99);
      expect(ir.nodes).toHaveLength(CANONICAL_ORDER.length);
      expect(ir.edges).toHaveLength(CANONICAL_ORDER.length - 1);
      expect(ir.violations).toHaveLength(0);
    });

    test('pipeline over empty trace produces PASS IR with empty graph', () => {
      const report = runCILite(null);
      const ir = generateCIGraphIR(report);
      expect(ir.status).toBe('PASS');
      expect(ir.nodes).toHaveLength(0);
      expect(ir.edges).toHaveLength(0);
    });

    test('IR is fully serialisable for git artifact storage', () => {
      const report = runCILite(traceWith([...CANONICAL_ORDER], 1));
      const ir = generateCIGraphIR(report);
      const json = JSON.stringify(ir, null, 2);
      const reparsed = JSON.parse(json);
      expect(reparsed.meta.version).toBe(IR_VERSION);
      expect(reparsed.nodes.length).toBe(CANONICAL_ORDER.length);
      expect(reparsed.edges.every(e => e.type === 'CAUSAL_FLOW')).toBe(true);
    });
  });
});
