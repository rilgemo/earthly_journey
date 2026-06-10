'use strict';

const { collectEvents }          = require('../../src/simulation/narrative/eventCollector');
const { processEvents, SENTENCE_BUILDERS } = require('../../src/simulation/narrative/narrativeEngine');
const { formatTickLog, formatWorldDigest, formatFullReport } = require('../../src/simulation/narrative/narrativeFormatter');
const { createNarrativeMemory }  = require('../../src/simulation/narrative/narrativeMemory');
const { buildNarrativeSnapshot } = require('../../src/simulation/narrative/narrativeSnapshot');

// ─── fixtures ────────────────────────────────────────────────────────────────

function birthEvent(childId, parentIds, generation = 1) {
  return Object.freeze({
    tick: 10, type: 'BIRTH',
    actors: Object.freeze([childId, ...parentIds]),
    data:   Object.freeze({ childId, parentIds, generation, birthTick: 10 }),
    severity: 0.4
  });
}

function deathEvent(agentId) {
  return Object.freeze({
    tick: 10, type: 'DEATH',
    actors: Object.freeze([agentId]),
    data:   Object.freeze({ agentId, causeOfDeath: 'old age', ageTicks: 500 }),
    severity: 0.5
  });
}

function structureEvent(violationType, from, to) {
  return Object.freeze({
    tick: 10, type: 'STRUCTURE',
    actors: Object.freeze([from, to]),
    data:   Object.freeze({ violationType, from, to, reason: 'test' }),
    severity: 0.9
  });
}

// ─── collectEvents ────────────────────────────────────────────────────────────

describe('collectEvents', () => {
  test('returns empty array for null trace', () => {
    expect(collectEvents(null, 1)).toEqual([]);
  });

  test('returns empty array for empty trace', () => {
    expect(collectEvents({}, 1)).toEqual([]);
  });

  test('emits BIRTH events from birthSystem.births', () => {
    const trace = {
      birthSystem: {
        births: [{
          id: 'C001',
          lineage: { parentIds: Object.freeze(['P001', 'P002']), birthTick: 5 }
        }]
      }
    };
    const events = collectEvents(trace, 5);
    expect(events.some(e => e.type === 'BIRTH' && e.data.childId === 'C001')).toBe(true);
  });

  test('BIRTH event actors include child and parents', () => {
    const trace = {
      birthSystem: {
        births: [{
          id: 'C001',
          lineage: { parentIds: Object.freeze(['P001', 'P002']), birthTick: 5 }
        }]
      }
    };
    const events = collectEvents(trace, 5);
    const birth = events.find(e => e.type === 'BIRTH');
    expect(birth.actors).toContain('C001');
    expect(birth.actors).toContain('P001');
  });

  test('emits DEATH events from life.corpseEntries', () => {
    const trace = { life: { corpseEntries: [{ id: 'X001', ageTicks: 300 }] } };
    const events = collectEvents(trace, 10);
    expect(events.some(e => e.type === 'DEATH' && e.data.agentId === 'X001')).toBe(true);
  });

  test('emits STRUCTURE events from architectureCI.violations', () => {
    const trace = {
      architectureCI: {
        violations: [{ type: 'CAUSAL_REVERSAL', from: 'A', to: 'B', reason: 'reversed' }]
      }
    };
    const events = collectEvents(trace, 10);
    expect(events.some(e => e.type === 'STRUCTURE')).toBe(true);
  });

  test('all returned events are frozen', () => {
    const trace = {
      birthSystem: { births: [{ id: 'C', lineage: { parentIds: Object.freeze(['P']), birthTick: 1 } }] }
    };
    const events = collectEvents(trace, 1);
    for (const e of events) {
      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.actors)).toBe(true);
      expect(Object.isFrozen(e.data)).toBe(true);
    }
  });

  test('severity is clamped to [0, 1]', () => {
    const trace = {
      architectureCI: {
        violations: [{ type: 'CYCLE', from: 'A', to: 'B', reason: 'cycle' }]
      }
    };
    const events = collectEvents(trace, 1);
    for (const e of events) {
      expect(e.severity).toBeGreaterThanOrEqual(0);
      expect(e.severity).toBeLessThanOrEqual(1);
    }
  });
});

// ─── processEvents ────────────────────────────────────────────────────────────

describe('processEvents', () => {
  test('returns object with required fields', () => {
    const out = processEvents([birthEvent('C', ['P1', 'P2'])], 10);
    expect(out).toHaveProperty('tick');
    expect(out).toHaveProperty('summary');
    expect(out).toHaveProperty('sentences');
    expect(out).toHaveProperty('worldState');
    expect(out).toHaveProperty('types');
  });

  test('result is frozen', () => {
    const out = processEvents([], 1);
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.sentences)).toBe(true);
  });

  test('empty events returns quiet-tick summary', () => {
    const out = processEvents([], 1);
    expect(out.summary).toContain('quiet');
  });

  test('BIRTH event produces a sentence containing child id', () => {
    const out = processEvents([birthEvent('Cain', ['Adam', 'Eve'])], 10);
    expect(out.sentences[0].text).toContain('Cain');
  });

  test('DEATH event produces a sentence containing agent id', () => {
    const out = processEvents([deathEvent('Abel')], 10);
    expect(out.sentences[0].text).toContain('Abel');
  });

  test('STRUCTURE event produces a sentence for CAUSAL_REVERSAL', () => {
    const out = processEvents([structureEvent('CAUSAL_REVERSAL', 'A', 'B')], 10);
    expect(out.sentences[0].text).toMatch(/reversed|causal/i);
  });

  test('worldState.totalBirths counts BIRTH events', () => {
    const events = [birthEvent('C1', ['P1']), birthEvent('C2', ['P2'])];
    const out = processEvents(events, 10);
    expect(out.worldState.totalBirths).toBe(2);
  });

  test('worldState.totalDeaths counts DEATH events', () => {
    const out = processEvents([deathEvent('X')], 10);
    expect(out.worldState.totalDeaths).toBe(1);
  });

  test('worldState.activeViolations counts STRUCTURE events', () => {
    const out = processEvents([structureEvent('CYCLE', 'A', 'B')], 10);
    expect(out.worldState.activeViolations).toBe(1);
  });

  test('worldState.generationPeak tracks max generation', () => {
    const out = processEvents([birthEvent('G', ['P'], 3)], 10);
    expect(out.worldState.generationPeak).toBe(3);
  });

  test('types array contains event types present', () => {
    const out = processEvents([birthEvent('C', ['P']), deathEvent('X')], 10);
    expect(out.types).toContain('BIRTH');
    expect(out.types).toContain('DEATH');
  });

  test('summary mentions births when present', () => {
    const out = processEvents([birthEvent('C', ['P'])], 10);
    expect(out.summary).toMatch(/life|born|world/i);
  });

  test('summary mentions structural instability when violations present', () => {
    const out = processEvents([structureEvent('FORBIDDEN_EDGE', 'A', 'B')], 10);
    expect(out.summary).toMatch(/instab|structural|causal/i);
  });

  test('tick is taken from argument', () => {
    expect(processEvents([], 42).tick).toBe(42);
  });

  test('tick falls back to first event tick', () => {
    const ev = { ...birthEvent('C', ['P']), tick: 99 };
    expect(processEvents([ev]).tick).toBe(99);
  });
});

// ─── SENTENCE_BUILDERS ────────────────────────────────────────────────────────

describe('SENTENCE_BUILDERS', () => {
  const makeBirthEv = (parentIds, gen) => ({
    actors: ['C', ...parentIds],
    data: { childId: 'C', parentIds, generation: gen }
  });

  test('BIRTH with 2 parents names both parents', () => {
    const s = SENTENCE_BUILDERS.BIRTH(makeBirthEv(['Adam', 'Eve'], 1));
    expect(s).toContain('Adam');
    expect(s).toContain('Eve');
  });

  test('BIRTH with 1 parent still produces a sentence', () => {
    expect(SENTENCE_BUILDERS.BIRTH(makeBirthEv(['Adam'], 1))).toContain('Adam');
  });

  test('BIRTH with 0 parents still produces a sentence', () => {
    expect(typeof SENTENCE_BUILDERS.BIRTH(makeBirthEv([], null))).toBe('string');
  });

  test('DEATH names the agent', () => {
    const s = SENTENCE_BUILDERS.DEATH({ actors: ['X'], data: { agentId: 'X', ageTicks: 100 } });
    expect(s).toContain('X');
  });

  test('STRUCTURE CYCLE mentions cycle or infinite', () => {
    const s = SENTENCE_BUILDERS.STRUCTURE({
      actors: [], data: { violationType: 'CYCLE', from: 'A', to: 'B', reason: '' }
    });
    expect(s).toMatch(/cycle|infinite/i);
  });
});

// ─── formatTickLog ────────────────────────────────────────────────────────────

describe('formatTickLog', () => {
  test('returns a string', () => {
    const out = processEvents([birthEvent('C', ['P'])], 10);
    expect(typeof formatTickLog(out)).toBe('string');
  });

  test('contains [Tick N] marker', () => {
    const out = processEvents([birthEvent('C', ['P'])], 77);
    expect(formatTickLog(out)).toContain('[Tick 77]');
  });

  test('contains sentence text', () => {
    const out = processEvents([birthEvent('Cain', ['Adam', 'Eve'])], 10);
    expect(formatTickLog(out)).toContain('Cain');
  });

  test('returns fallback for null', () => {
    expect(formatTickLog(null)).toContain('no output');
  });
});

// ─── formatWorldDigest ────────────────────────────────────────────────────────

describe('formatWorldDigest', () => {
  test('returns a string', () => {
    const o1 = processEvents([birthEvent('C', ['P'])], 1);
    const o2 = processEvents([deathEvent('X')], 2);
    expect(typeof formatWorldDigest([o1, o2])).toBe('string');
  });

  test('contains tick range', () => {
    const o1 = processEvents([], 10);
    const o2 = processEvents([], 20);
    expect(formatWorldDigest([o1, o2])).toContain('10');
    expect(formatWorldDigest([o1, o2])).toContain('20');
  });

  test('contains Births line', () => {
    const out = processEvents([birthEvent('C', ['P'])], 1);
    expect(formatWorldDigest([out])).toContain('Births:');
  });

  test('returns fallback for empty array', () => {
    expect(formatWorldDigest([])).toContain('no digest');
  });
});

// ─── createNarrativeMemory ────────────────────────────────────────────────────

describe('createNarrativeMemory', () => {
  test('starts at size 0', () => {
    expect(createNarrativeMemory().size()).toBe(0);
  });

  test('append increases size', () => {
    const m = createNarrativeMemory();
    m.append(processEvents([], 1));
    expect(m.size()).toBe(1);
  });

  test('evicts oldest when max exceeded', () => {
    const m = createNarrativeMemory(3);
    for (let i = 1; i <= 4; i++) m.append(processEvents([], i));
    expect(m.size()).toBe(3);
    expect(m.all()[0].tick).toBe(2); // oldest evicted
  });

  test('range returns correct subset', () => {
    const m = createNarrativeMemory();
    for (let t = 1; t <= 10; t++) m.append(processEvents([], t));
    const r = m.range(3, 6);
    expect(r).toHaveLength(4);
    expect(r.every(o => o.tick >= 3 && o.tick <= 6)).toBe(true);
  });

  test('recent returns last N', () => {
    const m = createNarrativeMemory();
    for (let t = 1; t <= 10; t++) m.append(processEvents([], t));
    const r = m.recent(3);
    expect(r).toHaveLength(3);
    expect(r[r.length - 1].tick).toBe(10);
  });

  test('stats aggregates correctly', () => {
    const m = createNarrativeMemory();
    m.append(processEvents([birthEvent('C1', ['P'])], 1));
    m.append(processEvents([deathEvent('X')], 2));
    const s = m.stats();
    expect(s.totalBirths).toBe(1);
    expect(s.totalDeaths).toBe(1);
  });

  test('clear empties memory', () => {
    const m = createNarrativeMemory();
    m.append(processEvents([], 1));
    m.clear();
    expect(m.size()).toBe(0);
  });

  test('append null does not crash', () => {
    const m = createNarrativeMemory();
    expect(() => m.append(null)).not.toThrow();
    expect(m.size()).toBe(0);
  });
});

// ─── buildNarrativeSnapshot ───────────────────────────────────────────────────

describe('buildNarrativeSnapshot', () => {
  test('returns required fields', () => {
    const m = createNarrativeMemory();
    m.append(processEvents([], 1));
    const snap = buildNarrativeSnapshot(m, 1);
    expect(snap).toHaveProperty('world', 'earthly_journey');
    expect(snap).toHaveProperty('tick', 1);
    expect(snap).toHaveProperty('stats');
    expect(snap).toHaveProperty('outputs');
  });

  test('outputs length matches memory size', () => {
    const m = createNarrativeMemory();
    for (let i = 1; i <= 5; i++) m.append(processEvents([], i));
    const snap = buildNarrativeSnapshot(m, 5);
    expect(snap.outputs).toHaveLength(5);
  });

  test('handles null memory gracefully', () => {
    const snap = buildNarrativeSnapshot(null, 1);
    expect(snap.outputs).toEqual([]);
  });
});
