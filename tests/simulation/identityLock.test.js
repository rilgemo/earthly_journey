const { ACTIONS_BY_ID } = require('../../src/simulation/actions');
const { createNPC } = require('../../src/simulation/agentModel');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const {
  applyPostTickIdentity,
  createIdentityFreeDecisionView,
  installIdentitySnapshot
} = require('../../src/simulation/identity/identityLock');
const { IDENTITY_LEAK_ERROR } = require('../../src/simulation/identity/identityGuard');
const { resolveIntent } = require('../../src/simulation/resolutionModel');
const { tickManager } = require('../../src/simulation/tickManager');
const { createArea } = require('../../src/simulation/worldField');

function world() {
  const area = createArea('tile', {}, { baselineField: {} });
  return {
    tick: 0,
    areas: new Map([['tile', area]]),
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    getField(id) { return this.areas.get(id).field; },
    getRecentEvents() { return []; }
  };
}

function intentContext(agent) {
  return {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: agent.needs },
    influenceProfile: {}
  };
}

function generateForgeIntent(agent) {
  const decisionView = createIdentityFreeDecisionView(agent);
  return generateIntents(decisionView, [ACTIONS_BY_ID.get('forge')], intentContext(decisionView));
}

describe('Identity Anti-Influence Lock v1', () => {
  test('changing identity does not affect intent output', () => {
    const first = createNPC({ id: 'first', location: 'tile', skills: { forging: 20 }, rng: () => 0.5 });
    const second = createNPC({ id: 'second', location: 'tile', skills: { forging: 20 }, rng: () => 0.5 });
    installIdentitySnapshot(first, ['Blacksmith']);
    installIdentitySnapshot(second, ['Mage', 'Farmer']);

    expect(generateForgeIntent(first)).toEqual(generateForgeIntent(second));
  });

  test('resolution output is independent of observational identity', () => {
    const first = createNPC({ id: 'first', location: 'tile', skills: { forging: 20 }, rng: () => 0.5 });
    const second = createNPC({ id: 'second', location: 'tile', skills: { forging: 20 }, rng: () => 0.5 });
    installIdentitySnapshot(second, ['Runesmith']);

    expect(resolveIntent(generateForgeIntent(first)))
      .toEqual(resolveIntent(generateForgeIntent(second)));
  });

  test('identity is absent before resolution and derived after tick processing', () => {
    const agent = createNPC({ id: 'agent', location: 'tile', skills: { farming: 20 }, rng: () => 0.5 });
    agent.skills.farming = 30;
    agent.memory.bias.farm = 100;

    expect(Object.prototype.hasOwnProperty.call(agent, 'identities')).toBe(false);
    tickManager([agent], world());

    expect(agent.identities).toContain('Farmer');
    expect(Object.isFrozen(agent.identities)).toBe(true);
  });

  test('guard throws when identity is injected into intent generation', () => {
    const agent = createIdentityFreeDecisionView(
      createNPC({ id: 'agent', location: 'tile', skills: { farming: 20 }, rng: () => 0.5 })
    );
    agent.identities = [];

    expect(() => generateIntents(
      agent,
      [ACTIONS_BY_ID.get('farm')],
      intentContext(agent)
    )).toThrow(IDENTITY_LEAK_ERROR);
  });

  test('resolution guard rejects identity-bearing candidates', () => {
    expect(() => resolveIntent([
      { intent: 'forge', score: 10, identities: ['Blacksmith'] }
    ])).toThrow(IDENTITY_LEAK_ERROR);
  });

  test('same seed produces the same skills and actions regardless of prior identity', () => {
    const first = createNPC({ id: 'agent', location: 'tile', skills: { farming: 20 }, rng: () => 0.42 });
    const second = createNPC({ id: 'agent', location: 'tile', skills: { farming: 20 }, rng: () => 0.42 });
    installIdentitySnapshot(first, ['Mage']);
    installIdentitySnapshot(second, ['Blacksmith', 'Runesmith']);
    first.memory.bias.farm = 100;
    second.memory.bias.farm = 100;

    const firstLog = tickManager([first], world());
    const secondLog = tickManager([second], world());

    expect(firstLog).toEqual(secondLog);
    expect(first.skills).toEqual(second.skills);
    expect(first.identities).toEqual(second.identities);
  });

  test('installed identity snapshots are immutable observations', () => {
    const agent = { skills: { forging: 30 } };
    const changes = applyPostTickIdentity(agent);
    const snapshot = changes.after;

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(() => snapshot.push('Mage')).toThrow();
    expect(Object.getOwnPropertyDescriptor(agent, 'identities').writable).toBe(false);
    expect(snapshot).toEqual(['Blacksmith']);
  });
});
