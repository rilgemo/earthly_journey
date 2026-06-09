const { ACTION_REGISTRY } = require('../../src/simulation/actionRegistry');
const registryJson = require('../../AI/action_registry.json');
const { ACTIONS, getAvailableActions } = require('../../src/simulation/actions');
const {
  ACTION_PROFILES,
} = require('../../src/simulation/actions/actionProfiles');
const { createInfluenceField } = require('../../src/simulation/influenceField');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { tickManager } = require('../../src/simulation/tickManager');
const { createArea } = require('../../src/simulation/worldField');
const { createPlayableWorldSlice } = require('../../src/simulation/scenarios/playableWorldSlice');
const { createSkills } = require('../../src/simulation/skills/skillSystem');
const { createTraits } = require('../../src/simulation/skills/traitSystem');

const EXPECTED_ACTIONS = [
  'forage', 'rest', 'move',
  'farm', 'gather_water', 'hunt', 'chop_wood', 'mine', 'forge', 'craft_item',
  'cast_magic', 'channel_arcane', 'study_arcane', 'meditate',
  'communicate', 'share_information', 'trade', 'teach',
  'attack', 'defend', 'flee'
];

const SKILL_SEEDS = {
  cultivation: { farming: 20, lifeManipulation: 5 },
  tracking: { hunting: 20, tracking: 15 },
  crafting: { forging: 20, mining: 15, crafting: 5 },
  arcane: { arcaneTheory: 20, arcaneManipulation: 15 }
};

function createAgent(seedName) {
  const agent = {
    id: `${seedName}-1`,
    type: 'npc',
    location: 'tile',
    stamina: 100,
    needs: { hunger: 0, fatigue: 0, manaNeed: 0, socialNeed: 0, safetyNeed: 0 },
    affinities: { fire: 0, water: 0, air: 0, earth: 0, life: 0, arcane: 0 },
    mana: {
      capacity: 100,
      current: 100,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    trustMap: {}
  };
  agent.skills = createSkills(SKILL_SEEDS[seedName] || {});
  agent.traits = createTraits(() => 0.5);
  agent.knowledge = [];
  return agent;
}

function createWorld(field = {}) {
  const area = createArea('tile', field, { baselineField: field });
  return {
    tick: 0,
    areas: new Map([['tile', area]]),
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    getField(tileId) {
      return this.areas.get(tileId).field;
    },
    getRecentEvents() {
      return [];
    }
  };
}

function intentsForSkills(seedName) {
  const agent = createAgent(seedName);
  const actions = getAvailableActions(agent);
  const influence = createInfluenceField({
    field: {},
    memories: [],
    needs: agent.needs
  });
  return generateIntents(agent, actions, {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: agent.needs },
    influenceProfile: influence.profile
  });
}

describe('Action Space Expansion v1', () => {
  test('all expanded actions exist in every runtime registry', () => {
    const actionIds = ACTIONS.map(action => action.id);

    EXPECTED_ACTIONS.forEach(action => {
      expect(ACTION_REGISTRY).toContain(action);
      expect(actionIds).toContain(action);
      expect(ACTION_PROFILES[action]).toBeDefined();
    });
    expect(registryJson).toEqual(ACTION_REGISTRY);
  });

  test('every action profile exposes the required semantic contract', () => {
    Object.values(ACTION_PROFILES).forEach(profile => {
      expect(profile).toEqual(expect.objectContaining({
        actionId: expect.any(String),
        category: expect.any(String),
        fieldAffinity: expect.any(Object),
        socialWeight: expect.any(Number),
        riskLevel: expect.any(Number),
        staminaCost: expect.any(Number),
        manaCost: expect.any(Number),
        expectedOutcomeBias: expect.any(String)
      }));
    });
  });

  test('key actions produce distinct field signatures', () => {
    const signatures = ['farm', 'forge', 'hunt', 'cast_magic']
      .map(action => JSON.stringify(ACTION_PROFILES[action].fieldAffinity));

    expect(new Set(signatures).size).toBe(signatures.length);
  });

  test('explicit continuous skills bias matching actions', () => {
    const score = (seedName, actionId) => intentsForSkills(seedName)
      .find(intent => intent.intent === actionId).components.skillScore;

    expect(score('cultivation', 'farm')).toBeGreaterThan(score('arcane', 'farm'));
    expect(score('tracking', 'hunt')).toBeGreaterThan(score('cultivation', 'hunt'));
    expect(score('crafting', 'forge')).toBeGreaterThan(score('tracking', 'forge'));
    expect(score('arcane', 'study_arcane')).toBeGreaterThan(score('crafting', 'study_arcane'));
  });

  test('mage cast_magic increases arcane instability through tickManager', () => {
    const world = createWorld({ arcane: 10 });
    tickManager([createAgent('arcane')], world);

    expect(world.areas.get('tile').field.arcane).toBeGreaterThan(10);
  });

  test('farmer farm increases life stability through tickManager', () => {
    const world = createWorld({ life: 10 });
    tickManager([createAgent('cultivation')], world);

    expect(world.areas.get('tile').field.life).toBeGreaterThan(10);
  });

  test('hunter hunt reduces life field through tickManager', () => {
    const world = createWorld({ life: 10 });
    tickManager([createAgent('tracking')], world);

    expect(world.areas.get('tile').field.life).toBeLessThan(10);
  });

  test('actions expose semantics but cannot bypass tickManager', () => {
    const world = createWorld({ life: 10 });
    const before = { ...world.areas.get('tile').field };

    getAvailableActions(createAgent('cultivation'));

    expect(world.areas.get('tile').field).toEqual(before);
    expect(ACTION_PROFILES.farm.execute).toBeUndefined();
    expect(ACTION_PROFILES.farm.mutate).toBeUndefined();
  });

  test('expanded skill-driven behavior is deterministic under the same seed', () => {
    const first = createPlayableWorldSlice({ seed: 12345 });
    const second = createPlayableWorldSlice({ seed: 12345 });

    tickManager(first.agents, first.world);
    tickManager(second.agents, second.world);

    expect(first.agents.map(agent => agent.runtime.lastSelectedIntent))
      .toEqual(second.agents.map(agent => agent.runtime.lastSelectedIntent));
  });
});
