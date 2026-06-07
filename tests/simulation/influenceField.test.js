/**
 * Influence Field v1
 *
 * Goal: additive behavioral pressure without selection, execution, or mutation.
 */

const {
  getWorldFieldInfluence,
  getObservedMemoryInfluence,
  getSocialInfluence,
  getRoleInfluence
} = require('../../src/simulation/influenceSources');
const { createInfluenceField, getActionInfluence } = require('../../src/simulation/influenceField');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { resolveIntent } = require('../../src/simulation/resolutionModel');

function createAgent(role = 'mage') {
  return {
    id: 'agent_1',
    role,
    affinities: { fire: 0, water: 0, earth: 0, arcane: 0 },
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: { bias: {} }
  };
}

describe('Influence Field v1', () => {
  test('world fields create additive influence through profiles', () => {
    const influence = getWorldFieldInfluence({ fire: 10, water: 5, arcane: 2 });

    expect(influence.forge).toBe(10);
    expect(influence.fire_magic).toBe(10);
    expect(influence.alchemy).toBe(5);
    expect(influence.cast_magic).toBe(2);
  });

  test('observed memories contribute memory influence', () => {
    const influence = getObservedMemoryInfluence([
      { type: 'danger', sourceType: 'self', strength: 10 },
      { type: 'resource', sourceType: 'self', strength: 5 }
    ]);

    expect(influence.safety).toBe(10);
    expect(influence.forage).toBe(5);
  });

  test('heard social memory is weaker than observed memory', () => {
    const observed = getObservedMemoryInfluence([
      { type: 'danger', sourceType: 'self', strength: 10 }
    ]);
    const heard = getSocialInfluence([
      { type: 'heard_danger', sourceType: 'heard', strength: 10 }
    ]);

    expect(heard.safety).toBeLessThan(observed.safety);
    expect(heard.safety).toBe(5);
  });

  test('role influence uses role profile', () => {
    expect(getRoleInfluence('blacksmith').forge).toBeGreaterThan(0);
    expect(getRoleInfluence('mage').cast_magic).toBeGreaterThan(0);
  });

  test('influence aggregation combines all source pressures', () => {
    const influence = createInfluenceField({
      field: { fire: 5, water: 0, arcane: 5 },
      memories: [
        { type: 'danger', sourceType: 'self', strength: 10 },
        { type: 'heard_magic', sourceType: 'heard', strength: 8 }
      ],
      needs: { hunger: 20, fatigue: 30, manaNeed: 40, socialNeed: 0, safetyNeed: 10 },
      role: 'mage'
    });

    expect(influence.profile.cast_magic).toBeGreaterThan(5);
    expect(influence.profile.safety).toBeGreaterThan(10);
    expect(influence.sources.world).toBeDefined();
    expect(influence.sources.social).toBeDefined();
    expect(influence.topInfluences.length).toBeGreaterThan(0);
  });

  test('influence field does not select actions or mutate world state', () => {
    const world = { fields: { fire: 10, water: 2, arcane: 4 } };
    const before = JSON.parse(JSON.stringify(world));

    const influence = createInfluenceField({ field: world.fields, role: 'blacksmith' });

    expect(world).toEqual(before);
    expect(influence).not.toHaveProperty('selectedAction');
    expect(influence).not.toHaveProperty('execute');
    expect(typeof getActionInfluence('cast_magic', influence.profile)).toBe('number');
  });

  test('RESOLUTION_MODEL remains final selection authority', () => {
    const agent = createAgent('mage');
    const actions = [
      { id: 'forage', type: 'survival', baseUtility: 1 },
      { id: 'cast_magic', type: 'magic', baseUtility: 1 }
    ];
    const influence = createInfluenceField({
      field: { fire: 0, water: 0, arcane: 10 },
      memories: [],
      needs: { hunger: 0, fatigue: 0, manaNeed: 0, socialNeed: 0, safetyNeed: 0 },
      role: 'mage'
    });

    const intents = generateIntents(agent, actions, {
      perception: { field: { fire: 0, water: 0, earth: 0, arcane: 10 }, nearbyAgents: [] },
      memories: [],
      needs: { profile: { hunger: 0, fatigue: 0, manaNeed: 0, socialNeed: 0, safetyNeed: 0 } },
      influenceProfile: influence.profile
    });

    expect(intents).toHaveLength(2);
    expect(intents).not.toHaveProperty('selectedAction');
    expect(resolveIntent(intents).intent).toBe('cast_magic');
  });
});
