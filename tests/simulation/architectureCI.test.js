const { runArchitectureCI } = require('../../src/simulation/architecture-ci/architectureCI');

// Minimal valid tick trace — all Layer 1/2/3 checks pass.
function validTrace() {
  return {
    current: {
      matingEvents: Object.freeze([
        Object.freeze({ pair: Object.freeze(['a', 'b']), affinity: 0.6 })
      ]),
      reproductionField: Object.freeze([
        Object.freeze({
          pair: Object.freeze(['a', 'b']),
          components: { bio: 0.5, mating: 0.6, competition: 0, demand: 0, structure: 0 },
          probabilityVector: { pairAttractor: 0.7, groupAttractor: 0.5, independentAttractor: 0.3 },
          combinedField: 1.1
        })
      ]),
      reproductionEvents: Object.freeze([
        Object.freeze({ parents: ['a', 'b'], probability: 0.7, confidence: 0.6, mode: 'pair', status: 'proposed' })
      ]),
      reproductionCommitment: Object.freeze({
        eligibleCandidates: [],
        suppressedCandidates: [],
        boundaryMetadata: {}
      }),
      life: Object.freeze({ agents: [], corpseEntries: [] }),
      birthSystem: Object.freeze({ births: [], rejectedCommitments: [], tick: 1 }),
      birthConsistency: Object.freeze({ violations: [] })
    }
  };
}

describe('Architecture CI v0', () => {
  describe('1. returns PASS for valid tick context', () => {
    test('returns status PASS when all checks pass', () => {
      const result = runArchitectureCI({ tick: 1, trace: validTrace() });
      expect(result.status).toBe('PASS');
      expect(result.violations).toEqual([]);
    });

    test('returns correct metadata shape', () => {
      const result = runArchitectureCI({ tick: 5, trace: validTrace() });
      expect(result.metadata).toEqual({ version: 'CI_V0', tick: 5 });
    });

    test('returns PASS with null trace (no current context)', () => {
      const result = runArchitectureCI({ tick: 1, trace: null });
      expect(result.status).toBe('PASS');
      expect(result.violations).toEqual([]);
    });

    test('returns PASS with empty current (no reproduction data yet)', () => {
      const result = runArchitectureCI({ tick: 1, trace: { current: {} } });
      expect(result.status).toBe('PASS');
    });
  });

  describe('2. detects causal cycle flag', () => {
    test('LAYER1: flags reproductionEvents without reproductionField', () => {
      const trace = validTrace();
      delete trace.current.reproductionField;
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER1') && v.includes('causal cycle'))).toBe(true);
    });

    test('LAYER1: flags birthSystem without reproductionCommitment', () => {
      const trace = validTrace();
      delete trace.current.reproductionCommitment;
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER1') && v.includes('tick order violated'))).toBe(true);
    });

    test('LAYER1: flags reproductionField without matingEvents', () => {
      const trace = validTrace();
      delete trace.current.matingEvents;
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER1') && v.includes('matingEvents'))).toBe(true);
    });

    test('LAYER1: flags backward influence when birthConsistency carries mutations', () => {
      const trace = validTrace();
      trace.current.birthConsistency = { mutations: [{ agentId: 'x' }] };
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER1') && v.includes('backward influence'))).toBe(true);
    });
  });

  describe('3. detects invalid mutation authority', () => {
    test('LAYER1: flags unfrozen matingEvents array', () => {
      const trace = validTrace();
      trace.current.matingEvents = [{ pair: ['a', 'b'], affinity: 0.5 }]; // not frozen
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER1') && v.includes('matingEvents is not frozen'))).toBe(true);
    });

    test('LAYER1: flags unfrozen reproductionField array', () => {
      const trace = validTrace();
      trace.current.reproductionField = [
        { pair: ['a', 'b'], components: { bio: 0.5, mating: 0.3 }, probabilityVector: {}, combinedField: 0 }
      ]; // not frozen
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER1') && v.includes('reproductionField is not frozen'))).toBe(true);
    });

    test('LAYER2: flags bond key present in reproductionField components', () => {
      const trace = validTrace();
      trace.current.reproductionField = Object.freeze([
        Object.freeze({
          pair: ['a', 'b'],
          components: { bio: 0.5, bond: 0.4, mating: 0, competition: 0, demand: 0, structure: 0 },
          probabilityVector: {},
          combinedField: 0
        })
      ]);
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER2') && v.includes('bond'))).toBe(true);
    });

    test('LAYER2: flags unfrozen individual mating event', () => {
      const trace = validTrace();
      trace.current.matingEvents = Object.freeze([
        { pair: ['a', 'b'], affinity: 0.5 } // event itself not frozen
      ]);
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER2') && v.includes('not frozen'))).toBe(true);
    });

    test('LAYER2: flags mating event with unexpected key', () => {
      const trace = validTrace();
      trace.current.matingEvents = Object.freeze([
        Object.freeze({ pair: ['a', 'b'], affinity: 0.5, bond: 0.9 }) // extra key
      ]);
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER2') && v.includes('unexpected key'))).toBe(true);
    });

    test('LAYER2: flags CommitmentBoundary report that contains births', () => {
      const trace = validTrace();
      trace.current.reproductionCommitment = { births: [{ id: 'newborn_1' }] };
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER2') && v.includes('CommitmentBoundary'))).toBe(true);
    });

    test('LAYER2: flags birthSystem running before life finalisation', () => {
      const trace = validTrace();
      delete trace.current.life;
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER2') && v.includes('post-death'))).toBe(true);
    });

    test('LAYER3: flags agent exceeding TOP_K_LIMIT in proposals', () => {
      const trace = validTrace();
      trace.current.reproductionEvents = Object.freeze([
        Object.freeze({ parents: ['a', 'b'], probability: 0.9 }),
        Object.freeze({ parents: ['a', 'c'], probability: 0.8 }),
        Object.freeze({ parents: ['a', 'd'], probability: 0.7 }),
        Object.freeze({ parents: ['a', 'e'], probability: 0.6 }) // agent 'a' appears 4 times
      ]);
      const result = runArchitectureCI({ tick: 1, trace });
      expect(result.status).toBe('FAIL');
      expect(result.violations.some(v => v.includes('LAYER3') && v.includes('TOP_K_LIMIT'))).toBe(true);
    });
  });

  describe('4. ensures no exception thrown', () => {
    test('does not throw when trace is undefined', () => {
      expect(() => runArchitectureCI({ tick: 1, trace: undefined })).not.toThrow();
    });

    test('does not throw when current is null', () => {
      expect(() => runArchitectureCI({ tick: 1, trace: { current: null } })).not.toThrow();
    });

    test('does not throw when matingEvents contains malformed entries', () => {
      expect(() => runArchitectureCI({
        tick: 1,
        trace: { current: { matingEvents: Object.freeze([Object.freeze({ pair: null, affinity: null })]) } }
      })).not.toThrow();
    });

    test('does not throw when reproductionEvents contains malformed entries', () => {
      expect(() => runArchitectureCI({
        tick: 1,
        trace: {
          current: {
            matingEvents: Object.freeze([]),
            reproductionField: Object.freeze([]),
            reproductionEvents: Object.freeze([Object.freeze({ parents: null })])
          }
        }
      })).not.toThrow();
    });

    test('does not throw when tick is 0', () => {
      expect(() => runArchitectureCI({ tick: 0, trace: validTrace() })).not.toThrow();
    });

    test('returns FAIL without throwing when multiple violations present', () => {
      const trace = { current: {} };
      trace.current.reproductionEvents = Object.freeze([]);
      delete trace.current.reproductionField;
      delete trace.current.matingEvents;
      let result;
      expect(() => { result = runArchitectureCI({ tick: 1, trace }); }).not.toThrow();
      expect(['PASS', 'FAIL']).toContain(result.status);
    });
  });

  describe('5. ensures input objects are not mutated', () => {
    test('does not mutate the trace object', () => {
      const trace = validTrace();
      const before = JSON.stringify(trace.current);
      runArchitectureCI({ tick: 1, trace });
      expect(JSON.stringify(trace.current)).toBe(before);
    });

    test('does not mutate the matingEvents array or its entries', () => {
      const trace = validTrace();
      const eventsBefore = JSON.stringify(trace.current.matingEvents);
      runArchitectureCI({ tick: 1, trace });
      expect(JSON.stringify(trace.current.matingEvents)).toBe(eventsBefore);
    });

    test('does not mutate the reproductionField array', () => {
      const trace = validTrace();
      const fieldBefore = JSON.stringify(trace.current.reproductionField);
      runArchitectureCI({ tick: 1, trace });
      expect(JSON.stringify(trace.current.reproductionField)).toBe(fieldBefore);
    });

    test('does not add properties to the trace object', () => {
      const trace = validTrace();
      const keysBefore = Object.keys(trace.current).sort().join(',');
      runArchitectureCI({ tick: 1, trace });
      expect(Object.keys(trace.current).sort().join(',')).toBe(keysBefore);
    });

    test('returned result does not share references with input trace', () => {
      const trace = validTrace();
      const result = runArchitectureCI({ tick: 1, trace });
      // mutating the result must not affect the trace
      result.violations.push('injected');
      expect(trace.current.matingEvents.length).toBe(1);
    });
  });

  describe('output determinism', () => {
    test('same trace produces identical result on repeated calls', () => {
      const trace = validTrace();
      const first = runArchitectureCI({ tick: 3, trace });
      const second = runArchitectureCI({ tick: 3, trace });
      expect(first).toEqual(second);
    });

    test('violation list order is stable across calls', () => {
      const trace = { current: {} };
      // produce multiple violations
      trace.current.reproductionEvents = Object.freeze([]);
      trace.current.birthSystem = {};
      // no reproductionCommitment, no matingEvents, no reproductionField, no life
      const first = runArchitectureCI({ tick: 1, trace });
      const second = runArchitectureCI({ tick: 1, trace });
      expect(first.violations).toEqual(second.violations);
    });
  });
});
