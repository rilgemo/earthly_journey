/**
 * Elemental Field Dynamics v1
 *
 * Goal: continuous world physics committed only by tickManager.
 */

const { createArea } = require('../../src/simulation/worldField');
const { diffuseFields } = require('../../src/simulation/elementalField/diffusionEngine');
const { restoreEquilibrium } = require('../../src/simulation/elementalField/equilibriumEngine');
const { applyConversions } = require('../../src/simulation/elementalField/conversionMatrix');
const { runFieldDynamicsTick } = require('../../src/simulation/elementalField/fieldDynamicsTick');
const { totalFieldEnergy } = require('../../src/simulation/elementalField/fieldState');
const { tickManager, queueFieldPerturbation } = require('../../src/simulation/tickManager');

function createTwoTileWorld() {
  const tileA = createArea('a', { fire: 10 }, { neighbors: ['b'], baselineField: { fire: 2 } });
  const tileB = createArea('b', { fire: 0 }, { neighbors: ['a'], baselineField: { fire: 2 } });

  return {
    areas: new Map([['a', tileA], ['b', tileB]]),
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0.1, conversionRate: 0, regenRate: 0 }
  };
}

describe('Elemental Field Dynamics v1', () => {
  test('diffusion occurs between neighboring tiles', () => {
    const tiles = {
      a: { field: { fire: 10 }, baselineField: {}, neighbors: ['b'] },
      b: { field: { fire: 0 }, baselineField: {}, neighbors: ['a'] }
    };

    const result = diffuseFields(tiles, 0.1);

    expect(result.a.field.fire).toBeCloseTo(9);
    expect(result.b.field.fire).toBeCloseTo(1);
    expect(tiles.a.field.fire).toBe(10);
  });

  test('diffusion remains conservative across many neighboring tiles', () => {
    const tiles = {
      center: {
        field: { fire: 10 },
        baselineField: {},
        neighbors: ['a', 'b', 'c']
      },
      a: { field: { fire: 0 }, baselineField: {}, neighbors: ['center'] },
      b: { field: { fire: 0 }, baselineField: {}, neighbors: ['center'] },
      c: { field: { fire: 0 }, baselineField: {}, neighbors: ['center'] }
    };

    const result = diffuseFields(tiles, 1);
    const total = Object.values(result)
      .reduce((sum, tile) => sum + tile.field.fire, 0);

    expect(total).toBeCloseTo(10);
    expect(result.center.field.fire).toBeGreaterThanOrEqual(0);
  });

  test('equilibrium restores fields toward baseline', () => {
    const result = restoreEquilibrium({
      meadow: {
        field: { fire: 0 },
        baselineField: { fire: 10 },
        neighbors: []
      }
    }, 0.2);

    expect(result.tiles.meadow.field.fire).toBeCloseTo(2);
    expect(result.equilibriumDelta.meadow.fire).toBeCloseTo(2);
  });

  test('conversion redistributes field energy without consuming it', () => {
    const tiles = {
      meadow: {
        field: { fire: 100, water: 0, air: 0, earth: 0, life: 0, arcane: 0 },
        baselineField: {},
        neighbors: []
      }
    };
    const before = totalFieldEnergy(tiles.meadow.field);

    const result = applyConversions(tiles, 0.1);
    const after = totalFieldEnergy(result.tiles.meadow.field);

    expect(result.conversionEvents.length).toBeGreaterThan(0);
    expect(result.tiles.meadow.field.fire).toBeCloseTo(90);
    expect(after).toBeCloseTo(before);
  });

  test('agent perturbation request does not directly mutate field state', () => {
    const world = createTwoTileWorld();
    const before = world.areas.get('a').field.fire;

    queueFieldPerturbation(world, 'a', { fire: 10, life: -3 });

    expect(world.areas.get('a').field.fire).toBe(before);
    expect(world.fieldPerturbationQueue).toHaveLength(1);
    expect(world.fieldPerturbationQueue[0].perturbation.life).toBe(-3);
  });

  test('tickManager world phase is the state committer', () => {
    const world = createTwoTileWorld();
    queueFieldPerturbation(world, 'a', { fire: 10 });

    tickManager([], world);
    const trace = world.lastFieldDynamicsTrace;

    expect(world.areas.get('a').field.fire).not.toBe(10);
    expect(world.fieldPerturbationQueue).toHaveLength(0);
    expect(world.lastFieldDynamicsTrace).toBe(trace);
    expect(trace.preDiffusionState.a.fire).toBe(20);
  });

  test('field values remain continuous and non-negative', () => {
    const world = createTwoTileWorld();
    world.fieldPerturbationQueue.push({ tileId: 'b', perturbation: { fire: -999, arcane: 1.25 } });

    const result = runFieldDynamicsTick(world.areas, world.fieldPerturbationQueue, {
      diffusionRate: 0.1,
      conversionRate: 0.05,
      regenRate: 0.1
    });

    Object.values(result.finalFieldState).forEach(field => {
      Object.values(field).forEach(value => {
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test('field dynamics exposes no resource consumption operation', () => {
    const dynamics = require('../../src/simulation/elementalField/fieldDynamicsTick');
    const fieldState = require('../../src/simulation/elementalField/fieldState');

    expect(dynamics.consumeField).toBeUndefined();
    expect(fieldState.consumeField).toBeUndefined();
  });
});
