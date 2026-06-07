const {
  createBeliefState,
  applyBeliefUpdate,
  createBeliefStore,
  getConflictingBeliefs,
  updateAgentBelief
} = require('../../src/simulation/perception/beliefState');
const { propagateInformation } = require('../../src/simulation/perception/informationPropagation');
const {
  createRealitySnapshot,
  perceiveReality,
  mapReplayFrameToPerception
} = require('../../src/simulation/perception/perceptionModel');
const { distortInformation } = require('../../src/simulation/perception/perceptionDistortion');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');

function reality() {
  return {
    tick: 10,
    fields: { fire: 5, life: 20 },
    agents: [{
      id: 'smith',
      skills: { forging: 40 },
      identities: ['Blacksmith']
    }],
    events: [{
      id: 'wolf-sighting',
      type: 'danger',
      target: 'wolf',
      location: 'forest',
      tick: 5,
      value: 10,
      details: { count: 3, direction: 'north' }
    }]
  };
}

function socialAgent(id, trust = {}) {
  return {
    id,
    trustMap: trust,
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} }
  };
}

describe('Reality vs Perception Split System v1', () => {
  test('the same reality produces different subjective perceptions', () => {
    const truth = reality();
    const event = truth.events[0];
    const near = perceiveReality({
      reality: truth,
      event,
      observer: { id: 'near', distance: 1 },
      options: { seed: 7 }
    });
    const far = perceiveReality({
      reality: truth,
      event,
      observer: { id: 'far', distance: 30 },
      options: { seed: 7 }
    });

    expect(near.beliefState).not.toEqual(far.beliefState);
    expect(near.update.confidence).toBeGreaterThan(far.update.confidence);
  });

  test('beliefs are stored outside authoritative runtime agents', () => {
    const agent = { id: 'villager', skills: { farming: 10 } };
    const store = createBeliefStore([agent.id]);
    const updated = updateAgentBelief(store, agent.id, {
      eventKey: 'weather',
      event: { eventKey: 'weather', claim: 'rain' },
      confidence: 0.6
    });

    expect(agent.beliefState).toBeUndefined();
    expect(updated.villager.beliefVersion).toBe(1);
    expect(store.villager.beliefVersion).toBe(0);
  });

  test('distance reduces belief accuracy', () => {
    const event = reality().events[0];
    const near = distortInformation(event, { distance: 1, observationRange: 10, seed: 1 });
    const far = distortInformation(event, { distance: 100, observationRange: 10, seed: 1 });

    expect(near.accuracy).toBeGreaterThan(far.accuracy);
    expect(near.confidence).toBeGreaterThan(far.confidence);
  });

  test('trust changes social information propagation strength', () => {
    const source = socialAgent('hunter');
    const highTrust = socialAgent('high', { hunter: 90 });
    const lowTrust = socialAgent('low', { hunter: 20 });
    const memory = { id: 'wolf-sighting', type: 'danger', target: 'wolf', strength: 100, tick: 1 };

    const high = propagateInformation({ source, receiver: highTrust, memory, tick: 2, seed: 3 });
    const low = propagateInformation({ source, receiver: lowTrust, memory, tick: 2, seed: 3 });

    expect(high.transfer.heardMemory.strength).toBeGreaterThan(low.transfer.heardMemory.strength);
    expect(high.update.confidence).toBeGreaterThan(low.update.confidence);
  });

  test('perception updates never mutate reality or social-memory inputs', () => {
    const truth = reality();
    const source = socialAgent('hunter');
    const receiver = socialAgent('villager', { hunter: 80 });
    const memory = { id: 'wolf-sighting', type: 'danger', target: 'wolf', strength: 100, tick: 1 };
    const before = JSON.stringify({ truth, source, receiver, memory });

    perceiveReality({ reality: truth, event: truth.events[0], observer: { id: 'observer' } });
    propagateInformation({ source, receiver, memory, tick: 2 });

    expect(JSON.stringify({ truth, source, receiver, memory })).toBe(before);
  });

  test('authoritative world objects become immutable pure-data snapshots', () => {
    const area = { id: 'forest', field: { life: 90 } };
    const world = {
      tick: 3,
      areas: new Map([['forest', area]]),
      getField() { return area.field; }
    };
    const snapshot = createRealitySnapshot(world);

    expect(snapshot.areas.forest.field.life).toBe(90);
    expect(snapshot.getField).toBeUndefined();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.areas.forest.field)).toBe(true);
  });

  test('contradicting beliefs coexist without rewriting truth', () => {
    const truth = reality();
    let beliefs = createBeliefState();
    beliefs = applyBeliefUpdate(beliefs, {
      eventKey: 'wolf-count',
      event: { eventKey: 'wolf-count', claim: 2, source: 'hunter' },
      confidence: 0.8
    });
    beliefs = applyBeliefUpdate(beliefs, {
      eventKey: 'wolf-count',
      event: { eventKey: 'wolf-count', claim: 8, source: 'merchant' },
      confidence: 0.4
    });

    expect(getConflictingBeliefs(beliefs, 'wolf-count')).toHaveLength(2);
    expect(truth.events[0].details.count).toBe(3);
  });

  test('replay mapping preserves reality while showing perception divergence over time', () => {
    const buffer = new ReplayBuffer();
    const truthFrame = { tick: 10, worldSnapshot: reality(), trace: [] };
    const firstBelief = applyBeliefUpdate(createBeliefState(), {
      eventKey: 'wolf-count',
      event: { eventKey: 'wolf-count', claim: 2 },
      confidence: 0.7
    });
    const laterBelief = applyBeliefUpdate(firstBelief, {
      eventKey: 'wolf-count',
      event: { eventKey: 'wolf-count', claim: 8 },
      confidence: 0.3
    });

    buffer.push(mapReplayFrameToPerception(truthFrame, { villager: firstBelief }));
    buffer.push(mapReplayFrameToPerception(truthFrame, { villager: laterBelief }));

    expect(buffer.get(0).realityFrame).toEqual(buffer.get(1).realityFrame);
    expect(buffer.get(0).perceptionSnapshots).not.toEqual(buffer.get(1).perceptionSnapshots);
  });

  test('distortion is deterministic with the same seed', () => {
    const event = reality().events[0];
    const options = {
      distance: 15,
      observationRange: 10,
      currentTick: 20,
      communicationQuality: 0.6,
      trust: 0.7,
      seed: 12345
    };

    expect(distortInformation(event, options)).toEqual(distortInformation(event, options));
  });
});
