'use strict';

const {
  buildPlayerPerspective,
  buildSelfView,
  buildLocalWorld,
  filterEventsForAgent,
  buildLineageAwareness,
  biasNarrative,
  computeUncertainty,
  INFLUENCE_RADIUS
} = require('../../src/simulation/perspective/playerPerspectiveEngine');

const { createLineageEngine }   = require('../../src/simulation/lineageEngine');
const { createNarrativeMemory } = require('../../src/simulation/narrative/narrativeMemory');
const { processEvents }         = require('../../src/simulation/narrative/narrativeEngine');

// ─── fixtures ────────────────────────────────────────────────────────────────

function makeAgent(id, energy = 0.6, lifeStage = 'adult', alive = true) {
  return { id, life: { alive, energy, lifeStage, ageTicks: 100 } };
}

function makeEvent(type, actors, severity = 0.5, data = {}) {
  return Object.freeze({
    tick: 10, type,
    actors: Object.freeze(actors),
    data:   Object.freeze(data),
    severity
  });
}

function makeLineageEngine() {
  const e = createLineageEngine();
  e.registerAgent({ id: 'Adam', lineage: null });
  e.registerAgent({ id: 'Eve',  lineage: null });
  e.registerBirth({
    id: 'Cain',
    lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 5 }
  }, []);
  e.registerBirth({
    id: 'Abel',
    lineage: { parentIds: Object.freeze(['Adam', 'Eve']), birthTick: 7 }
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

// ─── buildPlayerPerspective — contract ───────────────────────────────────────

describe('buildPlayerPerspective — contract', () => {
  test('returns required top-level keys', () => {
    const p = buildPlayerPerspective({ agentId: 'Adam', agents: [makeAgent('Adam')] });
    expect(p).toHaveProperty('tick');
    expect(p).toHaveProperty('self');
    expect(p).toHaveProperty('perceivedWorld');
    expect(p).toHaveProperty('perceivedEvents');
    expect(p).toHaveProperty('perceivedLineage');
    expect(p).toHaveProperty('narrativeBias');
    expect(p).toHaveProperty('uncertainty');
  });

  test('result is frozen', () => {
    const p = buildPlayerPerspective({});
    expect(Object.isFrozen(p)).toBe(true);
  });

  test('does not throw on null context', () => {
    expect(() => buildPlayerPerspective(null)).not.toThrow();
  });

  test('does not throw on empty context', () => {
    expect(() => buildPlayerPerspective({})).not.toThrow();
  });

  test('tick is taken from context', () => {
    expect(buildPlayerPerspective({ tick: 42 }).tick).toBe(42);
  });

  test('tick is null when absent', () => {
    expect(buildPlayerPerspective({}).tick).toBeNull();
  });

  test('perceivedEvents is an array', () => {
    expect(Array.isArray(buildPlayerPerspective({}).perceivedEvents)).toBe(true);
  });

  test('narrativeBias is an array', () => {
    expect(Array.isArray(buildPlayerPerspective({}).narrativeBias)).toBe(true);
  });

  test('uncertainty is a number between 0 and 1', () => {
    const p = buildPlayerPerspective({ agentId: 'A', agents: [makeAgent('A')] });
    expect(p.uncertainty).toBeGreaterThanOrEqual(0);
    expect(p.uncertainty).toBeLessThanOrEqual(1);
  });
});

// ─── buildSelfView ────────────────────────────────────────────────────────────

describe('buildSelfView', () => {
  test('returns required fields', () => {
    const s = buildSelfView(makeAgent('A'));
    expect(s).toHaveProperty('id');
    expect(s).toHaveProperty('state');
    expect(s).toHaveProperty('internalEnergy');
    expect(s).toHaveProperty('lifeStage');
  });

  test('id matches agent id', () => {
    expect(buildSelfView(makeAgent('Adam')).id).toBe('Adam');
  });

  test('state is "alive" for alive agent', () => {
    expect(buildSelfView(makeAgent('A', 0.5, 'adult', true)).state).toBe('alive');
  });

  test('state is "dead" for dead agent', () => {
    expect(buildSelfView(makeAgent('A', 0.5, 'adult', false)).state).toBe('dead');
  });

  test('internalEnergy reflects life.energy', () => {
    expect(buildSelfView(makeAgent('A', 0.8)).internalEnergy).toBe(0.8);
  });

  test('lifeStage matches agent', () => {
    expect(buildSelfView(makeAgent('A', 0.5, 'juvenile')).lifeStage).toBe('juvenile');
  });

  test('returns unknown state for null agent', () => {
    const s = buildSelfView(null);
    expect(s.state).toBe('unknown');
    expect(s.id).toBeNull();
  });

  test('falls back to mana when energy absent', () => {
    const agent = { id: 'A', mana: 0.4, life: { alive: true, lifeStage: 'adult' } };
    expect(buildSelfView(agent).internalEnergy).toBe(0.4);
  });
});

// ─── buildLocalWorld ──────────────────────────────────────────────────────────

describe('buildLocalWorld', () => {
  test('returns nearbyAgents and visibleFields', () => {
    const lw = buildLocalWorld(makeAgent('A'), {}, [makeAgent('A')]);
    expect(lw).toHaveProperty('nearbyAgents');
    expect(lw).toHaveProperty('visibleFields');
  });

  test('nearbyAgents is an array', () => {
    expect(Array.isArray(buildLocalWorld(makeAgent('A'), {}, [makeAgent('A')]).nearbyAgents)).toBe(true);
  });

  test('agent does not include itself in nearbyAgents', () => {
    const agents = [makeAgent('A'), makeAgent('B')];
    const lw = buildLocalWorld(makeAgent('A'), {}, agents);
    expect(lw.nearbyAgents).not.toContain('A');
  });

  test('agents within radius are included', () => {
    const agents = [makeAgent('A'), makeAgent('B'), makeAgent('C')];
    const lw = buildLocalWorld(agents[0], {}, agents);
    expect(lw.nearbyAgents).toContain('B');
  });

  test('dead agents are not included in nearbyAgents', () => {
    const agents = [makeAgent('A'), makeAgent('B', 0.5, 'adult', false)];
    const lw = buildLocalWorld(agents[0], {}, agents);
    expect(lw.nearbyAgents).not.toContain('B');
  });

  test('visibleFields contains degraded field labels', () => {
    const world = { fields: { water: 0.8 } };
    const lw = buildLocalWorld(makeAgent('A'), world, [makeAgent('A')]);
    expect(typeof lw.visibleFields.water).toBe('string');
  });

  test('high field value produces "high presence"', () => {
    const world = { fields: { fire: 0.9 } };
    const lw = buildLocalWorld(makeAgent('A'), world, [makeAgent('A')]);
    expect(lw.visibleFields.fire).toBe('high presence');
  });

  test('low field value produces "weak presence"', () => {
    const world = { fields: { water: 0.1 } };
    const lw = buildLocalWorld(makeAgent('A'), world, [makeAgent('A')]);
    expect(lw.visibleFields.water).toBe('weak presence');
  });

  test('moderate field value produces "moderate presence"', () => {
    const world = { fields: { earth: 0.5 } };
    const lw = buildLocalWorld(makeAgent('A'), world, [makeAgent('A')]);
    expect(lw.visibleFields.earth).toBe('moderate presence');
  });

  test('handles null agent gracefully', () => {
    expect(() => buildLocalWorld(null, {}, [])).not.toThrow();
  });

  test('agents beyond radius are excluded', () => {
    // Place agent at index 0; agents at index > INFLUENCE_RADIUS should not appear
    const agents = [makeAgent('A')];
    for (let i = 1; i <= INFLUENCE_RADIUS + 2; i++) {
      agents.push(makeAgent(`B${i}`));
    }
    const lw = buildLocalWorld(agents[0], {}, agents);
    const lastId = agents[agents.length - 1].id;
    expect(lw.nearbyAgents).not.toContain(lastId);
  });
});

// ─── filterEventsForAgent ─────────────────────────────────────────────────────

describe('filterEventsForAgent', () => {
  test('returns empty array for no events', () => {
    expect(filterEventsForAgent([], makeAgent('A'))).toEqual([]);
  });

  test('returns empty array for null events', () => {
    expect(filterEventsForAgent(null, makeAgent('A'))).toEqual([]);
  });

  test('perceives events where agent is a direct actor', () => {
    const events = [makeEvent('BIRTH', ['Cain', 'Adam', 'Eve'], 0.4)];
    const result = filterEventsForAgent(events, makeAgent('Adam'));
    expect(result.length).toBeGreaterThan(0);
  });

  test('perceived direct BIRTH event mentions "soul" or "born"', () => {
    const events = [makeEvent('BIRTH', ['Cain', 'Adam'], 0.4)];
    const result = filterEventsForAgent(events, makeAgent('Adam'));
    expect(result[0]).toMatch(/soul|born|enters/i);
  });

  test('perceived direct DEATH event mentions "ends" or "gone"', () => {
    const events = [makeEvent('DEATH', ['X001'], 0.5)];
    const result = filterEventsForAgent(events, makeAgent('X001'));
    expect(result[0]).toMatch(/ends|gone|life/i);
  });

  test('perceives high-severity distant events', () => {
    const events = [makeEvent('BIRTH', ['Cain', 'Eve'], 0.8)];
    const result = filterEventsForAgent(events, makeAgent('Adam'));
    // Adam is not an actor but severity >= 0.7
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatch(/sense|somewhere/i);
  });

  test('does not perceive low-severity distant events', () => {
    const events = [makeEvent('BIRTH', ['Cain', 'Eve'], 0.3)];
    const result = filterEventsForAgent(events, makeAgent('Adam'));
    // Adam not actor, severity < 0.7 — should not perceive
    expect(result).toHaveLength(0);
  });

  test('returns array of strings', () => {
    const events = [makeEvent('STRUCTURE', ['A', 'B'], 0.9)];
    const result = filterEventsForAgent(events, makeAgent('A'));
    result.forEach(s => expect(typeof s).toBe('string'));
  });
});

// ─── buildLineageAwareness ────────────────────────────────────────────────────

describe('buildLineageAwareness', () => {
  test('returns parents, children, depthAwareness', () => {
    const la = buildLineageAwareness(makeAgent('Adam'), makeLineageEngine());
    expect(la).toHaveProperty('parents');
    expect(la).toHaveProperty('children');
    expect(la).toHaveProperty('depthAwareness');
  });

  test('root agent parents are ["unknown"]', () => {
    const la = buildLineageAwareness(makeAgent('Adam'), makeLineageEngine());
    expect(la.parents).toEqual(['unknown']);
  });

  test('root agent has children', () => {
    const la = buildLineageAwareness(makeAgent('Adam'), makeLineageEngine());
    expect(la.children.length).toBeGreaterThan(0);
    expect(la.children).toContain('Cain');
  });

  test('child agent has parents', () => {
    const la = buildLineageAwareness(makeAgent('Cain'), makeLineageEngine());
    expect(la.parents).toContain('Adam');
    expect(la.parents).toContain('Eve');
  });

  test('depthAwareness is a non-negative integer', () => {
    const la = buildLineageAwareness(makeAgent('Cain'), makeLineageEngine());
    expect(la.depthAwareness).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(la.depthAwareness)).toBe(true);
  });

  test('depthAwareness capped at 4', () => {
    const la = buildLineageAwareness(makeAgent('Cain'), makeLineageEngine());
    expect(la.depthAwareness).toBeLessThanOrEqual(4);
  });

  test('returns empty awareness for null agent', () => {
    const la = buildLineageAwareness(null, makeLineageEngine());
    expect(la.parents).toEqual(['unknown']);
    expect(la.children).toEqual([]);
    expect(la.depthAwareness).toBe(0);
  });

  test('returns empty awareness for null engine', () => {
    const la = buildLineageAwareness(makeAgent('Adam'), null);
    expect(la.parents).toEqual(['unknown']);
    expect(la.depthAwareness).toBe(0);
  });
});

// ─── biasNarrative ────────────────────────────────────────────────────────────

describe('biasNarrative', () => {
  test('returns array of strings', () => {
    const m = makeNarrativeMemory('A generation was born.');
    const result = biasNarrative(m, makeAgent('A'));
    result.forEach(s => expect(typeof s).toBe('string'));
  });

  test('returns fallback when memory is null', () => {
    const result = biasNarrative(null, makeAgent('A'));
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatch(/beyond|perception/i);
  });

  test('returns fallback when memory is empty', () => {
    const m = createNarrativeMemory();
    const result = biasNarrative(m, makeAgent('A'));
    expect(result[0]).toMatch(/stirs|nothing/i);
  });

  test('dead agent receives "fades to silence" narrative', () => {
    const m = makeNarrativeMemory('Births occurred.');
    const dead = makeAgent('A', 0.5, 'adult', false);
    const result = biasNarrative(m, dead);
    expect(result[0]).toMatch(/silence/i);
  });

  test('low-energy agent gets weakened narrative', () => {
    const m = makeNarrativeMemory('Three new souls emerged.');
    const weak = makeAgent('A', 0.1);
    const result = biasNarrative(m, weak);
    expect(result[0]).toMatch(/dims|perception/i);
  });

  test('high-energy agent gets amplified narrative', () => {
    const m = makeNarrativeMemory('The world stirs.');
    const strong = makeAgent('A', 0.9);
    const result = biasNarrative(m, strong);
    expect(result[0]).toMatch(/vividly/i);
  });

  test('deduplicates identical summaries', () => {
    const m = makeNarrativeMemory('Same event.', 'Same event.', 'Same event.');
    const result = biasNarrative(m, makeAgent('A', 0.5));
    expect(result.filter(s => s === 'Same event.').length).toBeLessThanOrEqual(1);
  });
});

// ─── computeUncertainty ───────────────────────────────────────────────────────

describe('computeUncertainty', () => {
  test('returns number between 0 and 1', () => {
    const agents = [makeAgent('A'), makeAgent('B'), makeAgent('C')];
    const u = computeUncertainty(agents[0], {}, agents);
    expect(u).toBeGreaterThanOrEqual(0);
    expect(u).toBeLessThanOrEqual(1);
  });

  test('returns 1.0 for dead agent', () => {
    const dead = makeAgent('A', 0.5, 'adult', false);
    expect(computeUncertainty(dead, {}, [dead])).toBe(1.0);
  });

  test('returns 1.0 for null agent', () => {
    expect(computeUncertainty(null, {}, [])).toBe(1.0);
  });

  test('isolated agent has higher uncertainty than connected agent', () => {
    const solo     = [makeAgent('A')];
    const crowded  = [makeAgent('A'), makeAgent('B'), makeAgent('C'), makeAgent('D')];
    const uSolo    = computeUncertainty(solo[0], {}, solo);
    const uCrowded = computeUncertainty(crowded[0], {}, crowded);
    expect(uSolo).toBeGreaterThan(uCrowded);
  });

  test('low-energy agent has higher uncertainty than high-energy agent', () => {
    const agents = [makeAgent('A', 0.1), makeAgent('B')];
    const uWeak  = computeUncertainty(agents[0], {}, agents);
    const aStr   = [makeAgent('A', 0.9), makeAgent('B')];
    const uStr   = computeUncertainty(aStr[0], {}, aStr);
    expect(uWeak).toBeGreaterThan(uStr);
  });

  test('extreme world fields increase uncertainty', () => {
    const agents   = [makeAgent('A'), makeAgent('B')];
    const stable   = { fields: { water: 0.5 } };
    const unstable = { fields: { water: 0.99 } };
    const uStable   = computeUncertainty(agents[0], stable, agents);
    const uUnstable = computeUncertainty(agents[0], unstable, agents);
    expect(uUnstable).toBeGreaterThan(uStable);
  });

  test('result is rounded to 3 decimal places', () => {
    const agents = [makeAgent('A'), makeAgent('B')];
    const u      = computeUncertainty(agents[0], {}, agents);
    expect(u).toBe(Math.round(u * 1000) / 1000);
  });
});

// ─── integration ──────────────────────────────────────────────────────────────

describe('buildPlayerPerspective — integration', () => {
  test('full context produces populated perspective for Adam', () => {
    const agents = [
      makeAgent('Adam', 0.8),
      makeAgent('Eve',  0.7),
      makeAgent('Cain', 0.5)
    ];
    const lineageEngine   = makeLineageEngine();
    const narrativeMemory = makeNarrativeMemory('Two souls walk the earth.', 'A child is born.');
    const events = [
      makeEvent('BIRTH', ['Cain', 'Adam', 'Eve'], 0.4, { childId: 'Cain', parentIds: ['Adam', 'Eve'] })
    ];

    const p = buildPlayerPerspective({
      tick: 5,
      agentId: 'Adam',
      world: { fields: { water: 0.6, fire: 0.3 } },
      agents,
      events,
      lineageEngine,
      narrativeMemory
    });

    expect(p.tick).toBe(5);
    expect(p.self.id).toBe('Adam');
    expect(p.self.state).toBe('alive');
    expect(p.perceivedWorld.nearbyAgents).toContain('Eve');
    expect(p.perceivedWorld.visibleFields.water).toBe('moderate presence');
    expect(p.perceivedLineage.children).toContain('Cain');
    expect(p.perceivedEvents.length).toBeGreaterThan(0);
    expect(p.narrativeBias.length).toBeGreaterThan(0);
    expect(p.uncertainty).toBeGreaterThanOrEqual(0);
    expect(p.uncertainty).toBeLessThanOrEqual(1);
  });

  test('agent with no lineage record produces safe defaults', () => {
    const agents = [makeAgent('Stranger')];
    const lineageEngine = makeLineageEngine(); // Stranger not registered

    const p = buildPlayerPerspective({
      tick: 1,
      agentId: 'Stranger',
      agents,
      lineageEngine
    });

    expect(p.perceivedLineage.parents).toEqual(['unknown']);
    expect(p.perceivedLineage.children).toEqual([]);
  });

  test('unknown agentId produces safe fallback perspective', () => {
    const p = buildPlayerPerspective({
      tick: 1,
      agentId: 'ghost',
      agents: [makeAgent('A'), makeAgent('B')]
    });

    expect(p.self.state).toBe('unknown');
    expect(p.uncertainty).toBe(1.0);
  });
});
