/**
 * Test 6: Field Stability
 * 
 * Goal: Elemental fields remain bounded
 * 
 * Contract:
 *   0 ≤ fire, water, earth, arcane < MAX_FIELD
 */

const {
  WorldState,
  TickManager
} = require('../testUtils');

describe('Test 6: Field Stability', () => {

  const MAX_FIELD = 1000;

  describe('Field bounds in WorldState', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
    });

    test('fire field stays within bounds', () => {
      expect(world.fire).toBeGreaterThanOrEqual(0);
      expect(world.fire).toBeLessThan(MAX_FIELD);

      // Large positive update
      world.updateField('fire', 2000);
      expect(world.fire).toBeLessThan(MAX_FIELD);
      expect(world.fire).toBeGreaterThanOrEqual(0);
    });

    test('water field stays within bounds', () => {
      expect(world.water).toBeGreaterThanOrEqual(0);
      expect(world.water).toBeLessThan(MAX_FIELD);

      // Large negative update
      world.updateField('water', -2000);
      expect(world.water).toBeGreaterThanOrEqual(0);
    });

    test('earth field stays within bounds', () => {
      expect(world.earth).toBeGreaterThanOrEqual(0);
      expect(world.earth).toBeLessThan(MAX_FIELD);

      // Alternate updates
      world.updateField('earth', 500);
      world.updateField('earth', -100);
      world.updateField('earth', 600);

      expect(world.earth).toBeGreaterThanOrEqual(0);
      expect(world.earth).toBeLessThan(MAX_FIELD);
    });

    test('arcane field stays within bounds', () => {
      expect(world.arcane).toBeGreaterThanOrEqual(0);
      expect(world.arcane).toBeLessThan(MAX_FIELD);

      world.updateField('arcane', 999);
      expect(world.arcane).toBeLessThan(MAX_FIELD);

      world.updateField('arcane', 100);
      expect(world.arcane).toBeLessThan(MAX_FIELD);
    });

  });

  describe('Field clamping', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
    });

    test('positive overflow clamped to max', () => {
      world.updateField('fire', MAX_FIELD + 100);
      expect(world.fire).toBeLessThanOrEqual(MAX_FIELD);
    });

    test('negative underflow clamped to zero', () => {
      world.updateField('water', -9999);
      expect(world.water).toBeGreaterThanOrEqual(0);
      expect(world.water).toBe(0);
    });

    test('all fields clamped independently', () => {
      world.updateField('fire', MAX_FIELD + 50);
      world.updateField('water', -200);
      world.updateField('earth', 100);
      world.updateField('arcane', MAX_FIELD + 1000);

      expect(world.fire).toBeLessThanOrEqual(MAX_FIELD);
      expect(world.water).toBeGreaterThanOrEqual(0);
      expect(world.earth).toBeLessThanOrEqual(MAX_FIELD);
      expect(world.arcane).toBeLessThanOrEqual(MAX_FIELD);

      expect(world.fire).toBeGreaterThanOrEqual(0);
      expect(world.water).toBeGreaterThanOrEqual(0);
      expect(world.earth).toBeGreaterThanOrEqual(0);
      expect(world.arcane).toBeGreaterThanOrEqual(0);
    });

  });

  describe('Field oscillation', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
    });

    test('fields oscillate within bounds', () => {
      for (let i = 0; i < 100; i++) {
        world.updateField('fire', i % 10 ? 50 : -30);
        expect(world.fire).toBeGreaterThanOrEqual(0);
        expect(world.fire).toBeLessThan(MAX_FIELD);
      }
    });

    test('all fields oscillate stably', () => {
      const fields = ['fire', 'water', 'earth', 'arcane'];

      for (let i = 0; i < 200; i++) {
        fields.forEach(field => {
          world.updateField(field, i % 2 ? 25 : -15);
        });
      }

      fields.forEach(field => {
        expect(world[field]).toBeGreaterThanOrEqual(0);
        expect(world[field]).toBeLessThan(MAX_FIELD);
      });
    });

  });

  describe('TickManager field stability', () => {

    test('20 ticks maintains field bounds', () => {
      const manager = new TickManager();
      manager.addAgent('hero');
      manager.runTicks(20);

      const state = manager.getState();
      const fields = state.fields;

      expect(fields.fire).toBeGreaterThanOrEqual(0);
      expect(fields.fire).toBeLessThan(MAX_FIELD);
      expect(fields.water).toBeGreaterThanOrEqual(0);
      expect(fields.water).toBeLessThan(MAX_FIELD);
      expect(fields.earth).toBeGreaterThanOrEqual(0);
      expect(fields.earth).toBeLessThan(MAX_FIELD);
      expect(fields.arcane).toBeGreaterThanOrEqual(0);
      expect(fields.arcane).toBeLessThan(MAX_FIELD);
    });

    test('5000 ticks maintains field bounds', () => {
      const manager = new TickManager();
      manager.addAgent('hero');
      manager.runTicks(5000);

      const state = manager.getState();
      const fields = state.fields;

      ['fire', 'water', 'earth', 'arcane'].forEach(field => {
        expect(fields[field]).toBeGreaterThanOrEqual(0);
        expect(fields[field]).toBeLessThan(MAX_FIELD);
      });
    });

    test('10 agents over 1000 ticks maintains bounds', () => {
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(1000);

      const state = manager.getState();
      const fields = state.fields;

      Object.values(fields).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(MAX_FIELD);
      });
    });

  });

  describe('Field decay mechanics', () => {

    test('fields decay per tick', () => {
      const manager = new TickManager(1);
      manager.world.fire = 100;
      manager.world.water = 100;

      const before = { fire: manager.world.fire, water: manager.world.water };

      manager.tick();

      // Fields should decay (in implementation, -1 per tick)
      // At minimum they shouldn't increase without action
      expect(manager.world.fire + manager.world.water)
        .toBeLessThanOrEqual(before.fire + before.water);
    });

  });

  describe('Field NaN prevention', () => {

    test('fields never become NaN', () => {
      const manager = new TickManager(42);
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(500);

      const state = manager.getState();
      Object.values(state.fields).forEach(value => {
        expect(isNaN(value)).toBe(false);
      });
    });

    test('validation detects NaN fields', () => {
      const world = new WorldState();
      world.fire = NaN;

      const validation = world.validateState();
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

  });

  describe('Field update failures', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
    });

    test('invalid field name returns false', () => {
      const result = world.updateField('invalid_field', 100);
      expect(result).toBe(false);
    });

    test('valid field update returns true', () => {
      const result = world.updateField('fire', 50);
      expect(result).toBe(true);
    });

  });

  describe('Field conservation across scenarios', () => {

    test('rapid fluctuations stay bounded', () => {
      const world = new WorldState();

      for (let i = 0; i < 1000; i++) {
        world.updateField('fire', Math.random() * 100 - 50);
      }

      expect(world.fire).toBeGreaterThanOrEqual(0);
      expect(world.fire).toBeLessThan(MAX_FIELD);
    });

    test('all fields stable under concurrent updates', () => {
      const world = new WorldState();

      for (let i = 0; i < 500; i++) {
        world.updateField('fire', 10);
        world.updateField('water', 10);
        world.updateField('earth', -5);
        world.updateField('arcane', -3);
      }

      const fields = { fire: world.fire, water: world.water, earth: world.earth, arcane: world.arcane };
      Object.values(fields).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(MAX_FIELD);
      });
    });

  });

});
