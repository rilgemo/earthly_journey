const fs = require('fs');
const path = require('path');
const { detectExchangeEvents } = require('../../src/simulation/protoEconomy/exchangeDetection');
const { buildExchangeContext } = require('../../src/simulation/protoEconomy/exchangeContextModel');
const { createReciprocityState, updateReciprocityState } = require('../../src/simulation/protoEconomy/reciprocityDynamics');
const { buildExchangeSnapshot } = require('../../src/simulation/protoEconomy/exchangeTraceBuilder');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function yieldSnapshot(actionId, finalYield) {
  return {
    actionId,
    actionType: actionId,
    finalYield,
    totalYield: Object.values(finalYield).reduce((sum, value) => sum + value, 0),
    tileContext: { tileId: 'tile-1-1' }
  };
}

function agent(overrides = {}) {
  return {
    agentId: 'a',
    actionSelected: 'farm',
    position: 'tile-1-1',
    needProfile: { hunger: 20, safetyNeed: 10, manaNeed: 0, socialNeed: 20 },
    actionYieldSnapshot: yieldSnapshot('farm', { food: 50 }),
    ...overrides
  };
}

function trace(overrides = {}) {
  return {
    tickId: 1,
    agents: [
      agent(),
      agent({
        agentId: 'b',
        actionSelected: 'mine',
        needProfile: { hunger: 80, safetyNeed: 10, manaNeed: 0, socialNeed: 30 },
        actionYieldSnapshot: yieldSnapshot('mine', { material: 30 })
      })
    ],
    ...overrides
  };
}

describe('Resource Exchange Emergence Layer v1', () => {
  test('exchange detection is deterministic for the same input', () => {
    const input = {
      trace: trace(),
      trustGraph: { a: { b: 90 }, b: { a: 70 } },
      behaviorSignatures: {
        a: { stabilityScore: 0.8 },
        b: { stabilityScore: 0.6 }
      }
    };

    expect(detectExchangeEvents(input)).toEqual(detectExchangeEvents(input));
  });

  test('exchange detection depends on multiple contextual factors', () => {
    const highContext = detectExchangeEvents({
      trace: trace(),
      trustGraph: { a: { b: 90 }, b: { a: 70 } },
      behaviorSignatures: { a: { stabilityScore: 0.8 }, b: { stabilityScore: 0.8 } }
    });
    const lowContext = detectExchangeEvents({
      trace: trace({
        agents: [
          agent(),
          agent({
            agentId: 'b',
            position: 'tile-9-9',
            needProfile: { hunger: 0, socialNeed: 0 },
            actionYieldSnapshot: yieldSnapshot('rest', {})
          })
        ]
      }),
      trustGraph: { a: { b: 5 }, b: { a: 5 } }
    });

    expect(highContext).toHaveLength(1);
    expect(lowContext).toHaveLength(0);
  });

  test('trust changes interaction likelihood and mode', () => {
    const highTrust = buildExchangeContext({
      giverTrace: trace().agents[0],
      receiverTrace: trace().agents[1],
      trace: trace(),
      trustGraph: { a: { b: 95 } }
    });
    const lowTrust = buildExchangeContext({
      giverTrace: trace().agents[0],
      receiverTrace: trace().agents[1],
      trace: trace(),
      trustGraph: { a: { b: 10 } }
    });

    expect(highTrust.interactionScore).toBeGreaterThan(lowTrust.interactionScore);
    expect(highTrust.trustLevel).toBeGreaterThan(lowTrust.trustLevel);
  });

  test('reciprocity can be delayed across ticks', () => {
    const state = createReciprocityState();
    const first = detectExchangeEvents({
      trace: trace({ tickId: 1 }),
      trustGraph: { a: { b: 90 }, b: { a: 90 } }
    });
    const afterFirst = updateReciprocityState(state, first, 1);
    const second = detectExchangeEvents({
      trace: trace({
        tickId: 4,
        agents: [
          agent({
            agentId: 'a',
            actionSelected: 'rest',
            needProfile: { hunger: 80 },
            actionYieldSnapshot: yieldSnapshot('rest', {})
          }),
          agent({
            agentId: 'b',
            actionSelected: 'mine',
            needProfile: { hunger: 10 },
            actionYieldSnapshot: yieldSnapshot('mine', { material: 60 })
          })
        ]
      }),
      trustGraph: { a: { b: 90 }, b: { a: 90 } }
    });
    const afterSecond = updateReciprocityState(afterFirst.state, second, 4);

    expect(afterSecond.links[0].type).toBe('delayed_return_interaction');
    expect(afterSecond.links[0].temporalDistance).toBe(3);
  });

  test('exchange keeps resources context-dependent without unified value conversion', () => {
    const events = detectExchangeEvents({
      trace: trace(),
      trustGraph: { a: { b: 90 }, b: { a: 90 } }
    });
    const snapshot = buildExchangeSnapshot({
      trace: trace(),
      events,
      reciprocity: updateReciprocityState(createReciprocityState(), events, 1)
    });
    const serialized = JSON.stringify(snapshot).toLowerCase();

    expect(snapshot.events[0].resourceFlow.out.food).toBeGreaterThan(0);
    expect(snapshot.events[0].resourceFlow.in.material).toBeGreaterThan(0);
    expect(serialized).not.toContain('currency');
    expect(serialized).not.toContain('price');
    expect(serialized).not.toContain('normalizedvalue');
  });

  test('replay preserves exchange snapshots emitted by TraceCollector', () => {
    const collector = new TraceCollector();
    collector.beginTick(1, { areas: new Map() });
    trace().agents.forEach(agentTrace => collector.recordAgent(agentTrace));
    collector.endTick();
    const replay = new ReplayBuffer();
    replay.push({ tick: 1, trace: collector.getAll() });

    expect(collector.getLatest().exchangeSnapshot).toBeDefined();
    expect(replay.latest().trace[0].exchangeSnapshot)
      .toEqual(collector.getLatest().exchangeSnapshot);
  });

  test('resource exchange modules do not couple to intent or resolution logic', () => {
    const protoDir = path.join(__dirname, '../../src/simulation/protoEconomy');
    const source = fs.readdirSync(protoDir)
      .filter(file => file.endsWith('.js'))
      .map(file => fs.readFileSync(path.join(protoDir, file), 'utf8'))
      .join('\n');

    expect(source).not.toContain('intentGenerator');
    expect(source).not.toContain('resolutionModel');
    expect(source).not.toContain('resolveIntent');
    expect(source).not.toContain('generateIntents');
  });

  test('exchange detection remains stable under repeated simulation', () => {
    let state = createReciprocityState(20);
    let lastSnapshot = null;

    for (let tick = 1; tick <= 50; tick += 1) {
      const events = detectExchangeEvents({
        trace: trace({ tickId: tick }),
        trustGraph: { a: { b: 80 }, b: { a: 80 } }
      });
      const reciprocity = updateReciprocityState(state, events, tick);
      state = reciprocity.state;
      lastSnapshot = buildExchangeSnapshot({ trace: trace({ tickId: tick }), events, reciprocity });
    }

    expect(state.chains.length).toBeLessThanOrEqual(20);
    expect(lastSnapshot.eventCount).toBe(1);
    expect(lastSnapshot.reciprocityChains.length).toBeLessThanOrEqual(20);
  });
});
