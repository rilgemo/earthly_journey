const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { runScenario } = require('../../src/simulation/runner/scenarioRunner');
const { formatSimulationReport } = require('../../src/simulation/runner/simulationReport');
const {
  TERRAIN_FIELDS,
  WORLD_SIZE,
  createPlayableWorldSlice
} = require('../../src/simulation/scenarios/playableWorldSlice');

describe('Simulation Scenario Runner v1', () => {
  test('same seed produces deterministic report output', () => {
    const first = runScenario({ days: 7, seed: 12345 });
    const second = runScenario({ days: 7, seed: 12345 });

    expect(first.report).toEqual(second.report);
  });

  test('playable world slice builds the controlled scenario', () => {
    const scenario = createPlayableWorldSlice({ seed: 42 });
    const types = scenario.agents.reduce((counts, agent) => {
      counts[agent.type] = (counts[agent.type] || 0) + 1;
      return counts;
    }, {});

    expect(scenario.world.areas.size).toBe(WORLD_SIZE * WORLD_SIZE);
    expect(types).toEqual({ npc: 12, animal: 6, monster: 2 });
    expect(scenario.world.terrainLocations.village.length).toBeGreaterThan(0);
    expect(scenario.world.terrainLocations.forest.length).toBeGreaterThan(0);
    expect(scenario.world.terrainLocations.river.length).toBeGreaterThan(0);
    expect(scenario.world.terrainLocations.mountain.length).toBeGreaterThan(0);

    Object.entries(TERRAIN_FIELDS).forEach(([terrain, fields]) => {
      const area = scenario.world.areas.get(scenario.world.terrainLocations[terrain][0]);
      expect(area.field).toMatchObject(fields);
    });
  });

  test('scenario completes and generates a pretty report', () => {
    const result = runScenario({ days: 7, seed: 7 });
    const output = formatSimulationReport(result.report);

    expect(result.report.daysSimulated).toBe(7);
    expect(result.report.scenario).toBe('Playable World Slice v1');
    expect(output).toContain('Simulation Report: Playable World Slice v1');
    expect(output).toContain('Replay frames: 7');
  });

  test('population and death metrics are valid', () => {
    const { report } = runScenario({ days: 7, seed: 9 });

    expect(report.population).toEqual({ npc: 12, animal: 6, monster: 2 });
    expect(report.deaths).toEqual({ npc: 0, animal: 0, monster: 0 });
    expect(Object.values(report.population).every(value => value >= 0)).toBe(true);
  });

  test('field metrics contain finite drift values', () => {
    const { report } = runScenario({ days: 7, seed: 11 });

    expect(Object.keys(report.fieldMetrics)).toEqual([
      'fireDrift',
      'waterDrift',
      'lifeDrift',
      'arcaneDrift'
    ]);
    expect(Object.values(report.fieldMetrics).every(Number.isFinite)).toBe(true);
  });

  test('stability metrics and event summary are present', () => {
    const { report } = runScenario({ days: 7, seed: 13 });

    expect(report.stabilityMetrics).toEqual(expect.objectContaining({
      fieldInstability: expect.any(Number),
      socialInstability: expect.any(Number),
      emergenceInstability: expect.any(Number),
      globalStabilityScore: expect.any(Number)
    }));
    expect(report.eventSummary).toEqual(expect.objectContaining({
      combat: expect.any(Number),
      death: expect.any(Number),
      communication: expect.any(Number),
      field: expect.any(Number)
    }));
  });

  test('replay integration is preserved with one independent frame per day', () => {
    const result = runScenario({ days: 7, seed: 15 });
    const firstFrame = result.replayBuffer.get(0);
    const originalDay = firstFrame.worldSnapshot.currentDay;

    firstFrame.worldSnapshot.currentDay = 999;

    expect(result.replayBuffer).toBeInstanceOf(ReplayBuffer);
    expect(result.report.replay.frameCount).toBe(7);
    expect(result.replayBuffer.latest().tick).toBe(7);
    expect(result.replayBuffer.get(0).worldSnapshot.currentDay).toBe(999);
    expect(result.replayBuffer.latest().worldSnapshot.currentDay).toBe(7);
    expect(originalDay).toBe(1);
  });

  test('supports requested 30 and 90 day durations', () => {
    expect(runScenario({ days: 30, seed: 21 }).report.daysSimulated).toBe(30);
    expect(runScenario({ days: 90, seed: 21 }).report.daysSimulated).toBe(90);
  });
});
