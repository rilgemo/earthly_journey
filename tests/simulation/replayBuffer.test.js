/**
 * Replay Buffer v1
 *
 * Goal: immutable read-only tick history for Simulation Inspector.
 */

const { ReplayBuffer } = require('../../src/simulation/replayBuffer');

describe('Replay Buffer v1', () => {
  test('push frame stores a replay frame', () => {
    const buffer = new ReplayBuffer();

    buffer.push({
      tick: 1,
      worldSnapshot: { tick: 1, fields: { fire: 0 } },
      trace: [],
      timestamp: 1000
    });

    expect(buffer.size()).toBe(1);
    expect(buffer.latest().tick).toBe(1);
  });

  test('old frame is dropped when maxFrames is exceeded', () => {
    const buffer = new ReplayBuffer(2);

    buffer.push({ tick: 1, worldSnapshot: { tick: 1 }, trace: [], timestamp: 1 });
    buffer.push({ tick: 2, worldSnapshot: { tick: 2 }, trace: [], timestamp: 2 });
    buffer.push({ tick: 3, worldSnapshot: { tick: 3 }, trace: [], timestamp: 3 });

    expect(buffer.size()).toBe(2);
    expect(buffer.get(0).tick).toBe(2);
    expect(buffer.get(1).tick).toBe(3);
  });

  test('stored snapshot is immutable from later source mutations', () => {
    const buffer = new ReplayBuffer();
    const world = {
      tick: 1,
      fields: { fire: 10, water: 0 },
      agents: [{ id: 'npc_1', mana: 50 }]
    };
    const trace = [{ tickId: 1, agents: [{ agentId: 'npc_1', actionSelected: 'forage' }] }];

    buffer.push({
      tick: world.tick,
      worldSnapshot: world,
      trace,
      timestamp: 1000
    });

    world.fields.fire = 100;
    world.agents[0].mana = 0;
    trace[0].agents[0].actionSelected = 'cast_spark';

    const frame = buffer.latest();

    expect(frame.worldSnapshot.fields.fire).toBe(10);
    expect(frame.worldSnapshot.agents[0].mana).toBe(50);
    expect(frame.trace[0].agents[0].actionSelected).toBe('forage');
  });
});
