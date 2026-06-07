const { ACTIONS_BY_ID } = require('../../src/simulation/actions');
const { createNPC } = require('../../src/simulation/agentModel');
const { BehaviorTraceRecorder } = require('../../src/simulation/behavior/behaviorTraceRecorder');
const { createBehavioralSignature, createBehavioralSignatures } = require('../../src/simulation/behavior/behavioralSignature');
const { detectLoops } = require('../../src/simulation/behavior/behaviorPatternExtractor');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { createIdentityFreeDecisionView } = require('../../src/simulation/identity/identityLock');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function history(agentId, actions) {
  return actions.map((action, index) => ({
    agentId,
    tick: index + 1,
    action,
    contextTags: ['test']
  }));
}

function seededHistory(agentId, seed, length = 20) {
  const actions = ['farm', 'rest', 'move', 'forage'];
  let state = seed;
  const selected = [];
  for (let index = 0; index < length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    selected.push(actions[state % actions.length]);
  }
  return history(agentId, selected);
}

function intentFor(agent, actionId) {
  const decisionView = createIdentityFreeDecisionView(agent);
  return generateIntents(decisionView, [ACTIONS_BY_ID.get(actionId)], {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: agent.needs },
    influenceProfile: {}
  });
}

describe('Behavioral Signature System v1', () => {
  test('the same agent produces a consistent signature under the same seed', () => {
    expect(createBehavioralSignature(seededHistory('farmer', 12345)))
      .toEqual(createBehavioralSignature(seededHistory('farmer', 12345)));
  });

  test('divergent agents produce different signatures', () => {
    const signatures = createBehavioralSignatures({
      farmer: history('farmer', ['farm', 'farm', 'farm', 'rest']),
      explorer: history('explorer', ['move', 'forage', 'hunt', 'rest'])
    });

    expect(signatures.farmer).not.toEqual(signatures.explorer);
    expect(signatures.farmer.dominantActions[0].action).toBe('farm');
    expect(signatures.explorer.explorationIndex).toBeGreaterThan(signatures.farmer.explorationIndex);
  });

  test('loop detection finds repetitive patterns', () => {
    const loops = detectLoops(history('agent', ['farm', 'rest', 'farm', 'rest', 'farm', 'rest']));

    expect(loops).toEqual(expect.arrayContaining([
      expect.objectContaining({ pattern: ['farm', 'rest'], repetitions: 3 })
    ]));
  });

  test('exploration index increases with varied actions', () => {
    const routine = createBehavioralSignature(history('routine', ['farm', 'farm', 'farm', 'farm']));
    const varied = createBehavioralSignature(history('varied', ['farm', 'rest', 'move', 'forage']));

    expect(varied.explorationIndex).toBeGreaterThan(routine.explorationIndex);
  });

  test('analytics does not influence intent or skill state', () => {
    const agent = createNPC({ id: 'agent', location: 'tile', skills: { farming: 20 }, rng: () => 0.5 });
    const skillsBefore = { ...agent.skills };
    const intentBefore = intentFor(agent, 'farm');

    createBehavioralSignature(history(agent.id, ['forge', 'forge', 'cast_magic']));

    expect(agent.skills).toEqual(skillsBefore);
    expect(intentFor(agent, 'farm')).toEqual(intentBefore);
    expect(agent.behavioralSignature).toBeUndefined();
  });

  test('Replay Buffer input produces deterministic analytics output', () => {
    const replay = new ReplayBuffer();
    replay.push({
      tick: 1,
      trace: [{ tickId: 1, agents: [{ agentId: 'agent', actionSelected: 'farm', position: 'field' }] }]
    });
    replay.push({
      tick: 2,
      trace: [{ tickId: 2, agents: [{ agentId: 'agent', actionSelected: 'rest', position: 'field' }] }]
    });
    const first = new BehaviorTraceRecorder();
    const second = new BehaviorTraceRecorder();

    first.loadReplayFrames(replay.getAll());
    second.loadReplayFrames(replay.getAll());

    expect(createBehavioralSignatures(first.getSnapshot()))
      .toEqual(createBehavioralSignatures(second.getSnapshot()));
  });

  test('sliding window retains only the latest configured actions', () => {
    const recorder = new BehaviorTraceRecorder(3);
    ['move', 'forage', 'farm', 'rest'].forEach((action, index) => {
      recorder.record({ agentId: 'agent', tick: index + 1, action });
    });

    expect(recorder.getAgentHistory('agent').map(entry => entry.action))
      .toEqual(['forage', 'farm', 'rest']);
  });

  test('TraceCollector captures post-action analytics without changing traces', () => {
    const collector = new TraceCollector(20, 5);
    collector.beginTick(1, { areas: new Map() });
    collector.recordAgent({ agentId: 'agent', actionSelected: 'farm', position: 'field' });
    collector.endTick();

    expect(collector.getLatest().agents[0].actionSelected).toBe('farm');
    expect(collector.getBehaviorSignatures().agent.dominantActions[0].action).toBe('farm');
    expect(Object.isFrozen(collector.getBehaviorHistory())).toBe(true);
  });
});
