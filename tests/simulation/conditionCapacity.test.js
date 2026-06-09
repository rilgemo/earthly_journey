const {
  CONDITION_DIMENSIONS,
  createConditionCapacity,
  resolveConditionSignals,
  supportsLife
} = require('../../src/simulation/life/conditionCapacityModel');
const { createNPC } = require('../../src/simulation/agentModel');
const { tickManager, simulateAgent } = require('../../src/simulation/tickManager');
const { createArea } = require('../../src/simulation/worldField');

function createWorld() {
  const area = createArea('tile', {}, { baselineField: {} });
  return {
    tick: 0,
    areas: new Map([['tile', area]]),
    fieldPerturbationQueue: [],
    getField() { return area.field; },
    getRecentEvents() { return []; }
  };
}

describe('Condition + Capacity model', () => {
  test('uses named dimensions instead of a scalar survival value', () => {
    const biology = createConditionCapacity();

    expect(Object.keys(biology.condition)).toEqual(CONDITION_DIMENSIONS);
    expect(Object.keys(biology.capacity)).toEqual(CONDITION_DIMENSIONS);
    expect(Object.values(biology.condition).every(value => typeof value === 'string')).toBe(true);
    expect(Object.values(biology.capacity).every(value => typeof value === 'string')).toBe(true);
    expect(biology.current).toBeUndefined();
    expect(biology.maximum).toBeUndefined();
    expect(biology.percentage).toBeUndefined();
  });

  test('no single condition dimension determines survival', () => {
    const biology = createConditionCapacity({
      condition: { structural: 'collapsed' }
    });

    expect(supportsLife(biology)).toBe(true);
    expect(resolveConditionSignals(biology).collapsedDimensions).toEqual(['structural']);
  });

  test('survival ends only after multidimensional collapse', () => {
    const biology = createConditionCapacity({
      condition: { structural: 'collapsed', neural: 'collapsed' }
    });

    expect(supportsLife(biology)).toBe(false);
    expect(resolveConditionSignals(biology).collapsedDimensions).toEqual(['structural', 'neural']);
  });

  test('age alone does not determine survival', () => {
    const agent = createNPC({ id: 'elder', location: 'tile', rng: () => 0.5 });
    agent.life = { ageTicks: 100, maxAgeTicks: 100, alive: true };

    tickManager([agent], createWorld());

    expect(agent.life.ageTicks).toBe(101);
    expect(agent.life.alive).toBe(true);
    expect(agent._pendingDeath).toBe(false);
  });

  test('tickManager marks multidimensional collapse and removes only during cleanup', () => {
    const agent = createNPC({ id: 'collapsed', location: 'tile', rng: () => 0.5 });
    agent.biology = createConditionCapacity({
      condition: { metabolic: 'collapsed', immune: 'collapsed' }
    });
    const agents = [agent];
    const world = createWorld();

    tickManager(agents, world);

    expect(agents).toHaveLength(0);
    expect(world.resourceEntries[0]).toEqual(expect.objectContaining({
      type: 'corpse',
      from: 'collapsed'
    }));
  });

  test('simulateAgent causal ordering remains unchanged', () => {
    const source = simulateAgent.toString();

    expect(source.indexOf('intentPipeline.execute')).toBeLessThan(source.indexOf('applyActionEffects'));
    expect(source.indexOf('applyActionEffects')).toBeLessThan(source.indexOf('recordActionOutcome'));
  });
});
