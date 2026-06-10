'use strict';

const {
  buildWorldObservation,
  summarizeWorld,
  buildPopulationView,
  buildLineageSummary,
  compressEvents,
  buildNarrativeView,
  detectAnomalies
} = require('../../src/simulation/observation/worldObservationEngine');

const { createLineageEngine }    = require('../../src/simulation/lineageEngine');
const { createNarrativeMemory }  = require('../../src/simulation/narrative/narrativeMemory');
const { processEvents }          = require('../../src/simulation/narrative/narrativeEngine');

// ─── fixtures ────────────────────────────────────────────────────────────────

function agent(id, lifeStage = 'adult', alive = true) {
  return { id, life: { lifeStage, alive, ageTicks: 100 } };
}

function makeLineageEngine() {
  const e = createLineageEngine();
  e.registerAgent({ id: 'Adam',  lineage: null });
  e.registerAgent({ id: 'Eve',   lineage: null });
  e.registerBirth({
    id: 'Cain',
    lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 10 }
  }, []);
  e.registerBirth({
    id: 'Abel',
    lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 12 }
  }, []);
  e.registerBirth({
    id: 'Enoch',
    lineage: { parentIds: Object.freeze(['Cain', 'Eve']), birthTick: 30 }
  }, []);
  return e;
}

function makeNarrativeMemory(...summaries) {
  const m = createNarrativeMemory();
  summaries.forEach((s, i) => {
    m.append({ tick: i + 1, summary: s, sentences: [], worldState: {}, types: [] });
  });
  return m;
}

// ─── buildWorldObservation ────────────────────────────────────────────────────

describe('buildWorldObservation — contract', () => {
  test('returns required top-level keys', () => {
    const obs = buildWorldObservation({});
    expect(obs).toHaveProperty('tick');
    expect(obs).toHaveProperty('worldState');
    expect(obs).toHaveProperty('population');
    expect(obs).toHaveProperty('events');
    expect(obs).toHaveProperty('lineageSummary');
    expect(obs).toHaveProperty('narrative');
    expect(obs).toHaveProperty('anomalies');
  });

  test('result is frozen', () => {
    expect(Object.isFrozen(buildWorldObservation({}))).toBe(true);
  });

  test('does not throw on null context', () => {
    expect(() => buildWorldObservation(null)).not.toThrow();
  });

  test('does not throw on empty context', () => {
    expect(() => buildWorldObservation({})).not.toThrow();
  });

  test('tick is taken from context', () => {
    expect(buildWorldObservation({ tick: 42 }).tick).toBe(42);
  });

  test('tick is null when absent', () => {
    expect(buildWorldObservation({}).tick).toBeNull();
  });

  test('events is an array', () => {
    expect(Array.isArray(buildWorldObservation({}).events)).toBe(true);
  });

  test('narrative is an array', () => {
    expect(Array.isArray(buildWorldObservation({}).narrative)).toBe(true);
  });

  test('anomalies is an array', () => {
    expect(Array.isArray(buildWorldObservation({}).anomalies)).toBe(true);
  });
});

// ─── summarizeWorld ───────────────────────────────────────────────────────────

describe('summarizeWorld', () => {
  test('returns elements and stability', () => {
    const s = summarizeWorld({});
    expect(s).toHaveProperty('elements');
    expect(s).toHaveProperty('stability');
  });

  test('stability is 1 for empty world', () => {
    expect(summarizeWorld({}).stability).toBe(1);
  });

  test('stability is between 0 and 1', () => {
    const world = { fields: { water: 0.9, fire: 0.1 } };
    const s     = summarizeWorld(world);
    expect(s.stability).toBeGreaterThanOrEqual(0);
    expect(s.stability).toBeLessThanOrEqual(1);
  });

  test('elements contains numeric fields from world.fields', () => {
    const world = { fields: { water: 0.5, fire: 0.3 } };
    const s     = summarizeWorld(world);
    expect(s.elements.water).toBe(0.5);
    expect(s.elements.fire).toBe(0.3);
  });

  test('handles null gracefully', () => {
    expect(() => summarizeWorld(null)).not.toThrow();
  });

  test('ignores non-numeric field values', () => {
    const world = { fields: { water: 0.5, label: 'high' } };
    const s     = summarizeWorld(world);
    expect(s.elements).not.toHaveProperty('label');
  });
});

// ─── buildPopulationView ──────────────────────────────────────────────────────

describe('buildPopulationView', () => {
  test('returns total, alive, distribution', () => {
    const p = buildPopulationView([agent('A')]);
    expect(p).toHaveProperty('total');
    expect(p).toHaveProperty('alive');
    expect(p).toHaveProperty('distribution');
  });

  test('total equals agents length', () => {
    const agents = [agent('A'), agent('B'), agent('C')];
    expect(buildPopulationView(agents).total).toBe(3);
  });

  test('alive counts agents with life.alive !== false', () => {
    const agents = [agent('A'), agent('B'), { id: 'C', life: { alive: false } }];
    expect(buildPopulationView(agents).alive).toBe(2);
  });

  test('distribution groups by lifeStage', () => {
    const agents = [
      agent('A', 'adult'),
      agent('B', 'adult'),
      agent('C', 'juvenile')
    ];
    const { distribution } = buildPopulationView(agents);
    expect(distribution.adult).toBe(2);
    expect(distribution.juvenile).toBe(1);
  });

  test('returns zeros for empty array', () => {
    const p = buildPopulationView([]);
    expect(p.total).toBe(0);
    expect(p.alive).toBe(0);
  });

  test('handles null gracefully', () => {
    expect(() => buildPopulationView(null)).not.toThrow();
  });
});

// ─── buildLineageSummary ──────────────────────────────────────────────────────

describe('buildLineageSummary', () => {
  test('returns roots, deepestLine, generationCount', () => {
    const ls = buildLineageSummary(makeLineageEngine(), ['Adam', 'Eve', 'Cain', 'Abel', 'Enoch']);
    expect(ls).toHaveProperty('roots');
    expect(ls).toHaveProperty('deepestLine');
    expect(ls).toHaveProperty('generationCount');
  });

  test('roots are gen-0 agents', () => {
    const ls = buildLineageSummary(makeLineageEngine(), ['Adam', 'Eve', 'Cain', 'Abel', 'Enoch']);
    expect(ls.roots).toContain('Adam');
    expect(ls.roots).toContain('Eve');
    expect(ls.roots).not.toContain('Cain');
  });

  test('generationCount reflects depth', () => {
    const ls = buildLineageSummary(makeLineageEngine(), ['Adam', 'Eve', 'Cain', 'Abel', 'Enoch']);
    expect(ls.generationCount).toBeGreaterThanOrEqual(2);
  });

  test('deepestLine is a non-empty string', () => {
    const ls = buildLineageSummary(makeLineageEngine(), ['Adam', 'Eve', 'Cain', 'Abel', 'Enoch']);
    expect(typeof ls.deepestLine).toBe('string');
    expect(ls.deepestLine.length).toBeGreaterThan(0);
  });

  test('deepestLine contains arrow separator', () => {
    const ls = buildLineageSummary(makeLineageEngine(), ['Adam', 'Eve', 'Cain', 'Abel', 'Enoch']);
    expect(ls.deepestLine).toContain('→');
  });

  test('returns empty summary for null engine', () => {
    const ls = buildLineageSummary(null, ['A']);
    expect(ls.roots).toHaveLength(0);
    expect(ls.deepestLine).toBeNull();
    expect(ls.generationCount).toBe(0);
  });
});

// ─── compressEvents ───────────────────────────────────────────────────────────

describe('compressEvents', () => {
  test('returns array of strings', () => {
    const result = compressEvents({}, null);
    expect(Array.isArray(result)).toBe(true);
    result.forEach(s => expect(typeof s).toBe('string'));
  });

  test('returns empty array for null trace', () => {
    expect(compressEvents(null, null)).toHaveLength(0);
  });

  test('produces birth statement for one birth', () => {
    const trace = {
      birthSystem: { births: [{ id: 'C001', lineage: { parentIds: Object.freeze([]) } }] }
    };
    const events = compressEvents(trace, null);
    expect(events.some(s => s.includes('C001') && s.includes('born'))).toBe(true);
  });

  test('produces plural birth statement for multiple births', () => {
    const trace = {
      birthSystem: {
        births: [
          { id: 'C1', lineage: { parentIds: Object.freeze([]) } },
          { id: 'C2', lineage: { parentIds: Object.freeze([]) } }
        ]
      }
    };
    const events = compressEvents(trace, null);
    expect(events.some(s => s.includes('2') && s.includes('born'))).toBe(true);
  });

  test('produces death statement', () => {
    const trace = { life: { corpseEntries: [{ id: 'X001' }] } };
    const events = compressEvents(trace, null);
    expect(events.some(s => s.includes('X001'))).toBe(true);
  });

  test('produces structural anomaly statement for CI violations', () => {
    const trace = {
      architectureCI: {
        violations: [{ type: 'CYCLE', from: 'A', to: 'B', reason: '' }]
      }
    };
    const events = compressEvents(trace, null);
    expect(events.some(s => /instab|anomal|cycle|causal/i.test(s))).toBe(true);
  });

  test('includes narrative memory summary when available', () => {
    const mem    = makeNarrativeMemory('A new generation emerged.');
    const events = compressEvents({}, mem);
    expect(events.some(s => s.includes('generation'))).toBe(true);
  });
});

// ─── buildNarrativeView ───────────────────────────────────────────────────────

describe('buildNarrativeView', () => {
  test('returns at least one string', () => {
    const r = buildNarrativeView(null, 1);
    expect(r.length).toBeGreaterThan(0);
    expect(typeof r[0]).toBe('string');
  });

  test('returns at most 3 entries', () => {
    const mem = makeNarrativeMemory('S1', 'S2', 'S3', 'S4', 'S5');
    expect(buildNarrativeView(mem, 5).length).toBeLessThanOrEqual(3);
  });

  test('returns fallback when memory is null', () => {
    const r = buildNarrativeView(null, 1);
    expect(r[0]).toMatch(/world|silence|still/i);
  });

  test('deduplicates identical summaries', () => {
    const mem = makeNarrativeMemory('Same.', 'Same.', 'Same.');
    const r   = buildNarrativeView(mem, 3);
    expect(r.filter(s => s === 'Same.')).toHaveLength(1);
  });
});

// ─── detectAnomalies ──────────────────────────────────────────────────────────

describe('detectAnomalies', () => {
  test('returns array', () => {
    expect(Array.isArray(detectAnomalies({}, [], {}))).toBe(true);
  });

  test('no anomalies for stable world', () => {
    const world = { fields: { water: 0.5, fire: 0.5 } };
    const agents = [agent('A'), agent('B')];
    expect(detectAnomalies(world, agents, {})).toHaveLength(0);
  });

  test('detects critical high field', () => {
    const world = { fields: { fire: 0.99 } };
    const a     = detectAnomalies(world, [], {});
    expect(a.some(s => /fire.*critical high/i.test(s))).toBe(true);
  });

  test('detects critical low field', () => {
    const world = { fields: { water: 0.01 } };
    const a     = detectAnomalies(world, [], {});
    expect(a.some(s => /water.*critical low/i.test(s))).toBe(true);
  });

  test('detects population extinction', () => {
    const agents = [
      { id: 'A', life: { alive: false } },
      { id: 'B', life: { alive: false } }
    ];
    const a = detectAnomalies({}, agents, {});
    expect(a.some(s => /extinct/i.test(s))).toBe(true);
  });

  test('detects CI CYCLE violation', () => {
    const trace = {
      architectureCI: { violations: [{ type: 'CYCLE', from: 'X', to: 'Y' }] }
    };
    const a = detectAnomalies({}, [], trace);
    expect(a.some(s => /cycle/i.test(s))).toBe(true);
  });

  test('handles null world gracefully', () => {
    expect(() => detectAnomalies(null, [], {})).not.toThrow();
  });
});

// ─── integration ──────────────────────────────────────────────────────────────

describe('buildWorldObservation — integration', () => {
  test('full context produces populated observation', () => {
    const agents = [
      agent('Adam', 'adult'),
      agent('Eve', 'adult'),
      agent('Cain', 'juvenile')
    ];
    const lineageEngine   = makeLineageEngine();
    const narrativeMemory = makeNarrativeMemory('Three souls walk the earth.');
    const trace = {
      birthSystem: { births: [{ id: 'Cain', lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 10 } }] }
    };

    const obs = buildWorldObservation({
      tick: 10,
      world:   { fields: { water: 0.6 } },
      agents,
      trace,
      lineageEngine,
      narrativeMemory
    });

    expect(obs.tick).toBe(10);
    expect(obs.population.total).toBe(3);
    expect(obs.lineageSummary.roots).toContain('Adam');
    expect(obs.events.length).toBeGreaterThan(0);
    expect(obs.narrative.some(s => s.includes('soul'))).toBe(true);
  });
});
