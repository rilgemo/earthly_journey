const { createNPC } = require('../../src/simulation/agentModel');
const { ACTIONS_BY_ID, getAvailableActions } = require('../../src/simulation/actions');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { learnKnowledge } = require('../../src/simulation/skills/knowledgeSystem');
const { deriveIdentities } = require('../../src/simulation/skills/identityDerivation');
const { applySkillGain, calculateSkillGain } = require('../../src/simulation/skills/skillGain');
const { createSkills } = require('../../src/simulation/skills/skillSystem');
const { createTraits } = require('../../src/simulation/skills/traitSystem');
const { createArea } = require('../../src/simulation/worldField');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');

function agent(overrides = {}) {
  return {
    id: 'agent-1',
    type: 'npc',
    location: 'tile',
    stamina: 100,
    needs: { hunger: 0, fatigue: 0, manaNeed: 0, socialNeed: 0, safetyNeed: 0 },
    affinities: {},
    mana: { capacity: 100, current: 100, stability: 0.8, affinity: { arcane: 1 } },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    trustMap: {},
    traits: createTraits(() => 0.5),
    skills: createSkills(),
    knowledge: [],
    ...overrides
  };
}

function world(field = {}) {
  const area = createArea('tile', field, { baselineField: field });
  return {
    tick: 0,
    areas: new Map([['tile', area]]),
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    getField(id) { return this.areas.get(id).field; },
    getRecentEvents() { return []; }
  };
}

function intentScore(subject, actionId) {
  const action = ACTIONS_BY_ID.get(actionId);
  return generateIntents(subject, [action], {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: subject.needs },
    influenceProfile: {}
  })[0];
}

describe('Skill Emergence System v1', () => {
  test('traits influence skill growth', () => {
    const low = agent({ traits: createTraits(() => 0, { fireAffinity: 0, manaSensitivity: 0 }) });
    const high = agent({ traits: createTraits(() => 0, { fireAffinity: 100, manaSensitivity: 100 }) });

    expect(calculateSkillGain(high, 'fireManipulation', 'cast_magic'))
      .toBeGreaterThan(calculateSkillGain(low, 'fireManipulation', 'cast_magic'));
  });

  test('actions increase matching continuous skills', () => {
    const subject = agent();
    const gains = applySkillGain(subject, 'hunt');

    expect(subject.skills.hunting).toBeGreaterThan(0);
    expect(subject.skills.tracking).toBeGreaterThan(0);
    expect(gains.every(gain => typeof gain.after === 'number')).toBe(true);
  });

  test('skill growth has diminishing returns', () => {
    const novice = agent({ skills: createSkills({ forging: 0 }) });
    const practiced = agent({ skills: createSkills({ forging: 80 }) });

    expect(calculateSkillGain(novice, 'forging', 'forge'))
      .toBeGreaterThan(calculateSkillGain(practiced, 'forging', 'forge'));
  });

  test('knowledge improves learning efficiency without granting skill', () => {
    const uninformed = agent();
    const informed = agent();
    learnKnowledge(informed, { key: 'steel-forging', topic: 'steel forging technique', action: 'forge' });

    expect(informed.skills.forging).toBe(0);
    expect(calculateSkillGain(informed, 'forging', 'forge'))
      .toBeGreaterThan(calculateSkillGain(uninformed, 'forging', 'forge'));
  });

  test('identity is derived from skills', () => {
    expect(deriveIdentities(createSkills({ farming: 30 }))).toContain('Farmer');
    expect(deriveIdentities(createSkills({ forging: 35, arcaneManipulation: 25 }))).toContain('Runesmith');
    expect(deriveIdentities(createSkills({ arcaneTheory: 30, arcaneManipulation: 25 }))).toContain('Mage');
  });

  test('agents contain no derived identity expression, behavioral expression, or class authority', () => {
    const subject = createNPC({ id: 'agent', skills: { farming: 20 }, rng: () => 0.5 });

    expect(subject.role).toBeUndefined();
    expect(subject.profession).toBeUndefined();
    expect(subject.class).toBeUndefined();
    expect(subject.skills.farming).toBe(20);
  });

  test('intent generation uses skills', () => {
    const skilled = agent({ skills: createSkills({ forging: 50 }) });
    const unskilled = agent({ skills: createSkills({ forging: 0 }) });

    expect(intentScore(skilled, 'forge').components.skillScore)
      .toBeGreaterThan(intentScore(unskilled, 'forge').components.skillScore);
  });

  test('trace and replay capture skill, knowledge, and identity changes', () => {
    const subject = agent({
      skills: createSkills({ arcaneTheory: 24.9, arcaneManipulation: 25 })
    });
    subject.skills.arcaneTheory = 24.9;
    subject.memory.bias.study_arcane = 100;
    const tracer = new TraceCollector();
    const replay = new ReplayBuffer();

    tickManager([subject], world({ arcane: 10 }), tracer);
    const trace = tracer.getLatest();
    replay.push({ tick: 1, trace });

    expect(trace.agents[0].skillGain.length).toBeGreaterThan(0);
    expect(trace.agents[0].knowledgeLearned.length).toBeGreaterThan(0);
    expect(trace.agents[0].identityChanges.added).toContain('Mage');
    expect(replay.latest().trace.agents[0].skillGain).toEqual(trace.agents[0].skillGain);
  });

  test('skill emergence is deterministic under the same seed', () => {
    const first = createNPC({ id: 'a', location: 'tile', skills: { farming: 20 }, rng: () => 0.42 });
    const second = createNPC({ id: 'a', location: 'tile', skills: { farming: 20 }, rng: () => 0.42 });
    first.memory.bias.farm = 100;
    second.memory.bias.farm = 100;

    tickManager([first], world(), new TraceCollector());
    tickManager([second], world(), new TraceCollector());

    expect(first.traits).toEqual(second.traits);
    expect(first.skills).toEqual(second.skills);
    expect(first.identities).toEqual(second.identities);
  });
});
