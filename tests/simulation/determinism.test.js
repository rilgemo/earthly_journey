/**
 * Test 4: Tick Determinism
 * 
 * Goal: Fixed seed = fixed output
 * 
 * Contract:
 *   runSimulation(seed=12345, world, agents)
 *   runSimulation(seed=12345, world, agents)
 *   ↓
 *   result_a === result_b
 */

const {
  TickManager,
  SeededRandom
} = require('../testUtils');

describe('Test 4: Tick Determinism', () => {

  describe('Seeded RNG determinism', () => {

    test('same seed produces same random sequence', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const values1 = [];
      const values2 = [];

      for (let i = 0; i < 10; i++) {
        values1.push(rng1.next());
        values2.push(rng2.next());
      }

      expect(values1).toEqual(values2);
    });

    test('different seeds produce different sequences', () => {
      const rng1 = new SeededRandom(111);
      const rng2 = new SeededRandom(222);

      const values1 = [];
      const values2 = [];

      for (let i = 0; i < 10; i++) {
        values1.push(rng1.next());
        values2.push(rng2.next());
      }

      // At least one value should differ
      const hasDifference = values1.some((v, i) => v !== values2[i]);
      expect(hasDifference).toBe(true);
    });

    test('nextInt is deterministic', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        const val1 = rng1.nextInt(1, 100);
        const val2 = rng2.nextInt(1, 100);
        expect(val1).toBe(val2);
      }
    });

  });

  describe('TickManager determinism', () => {

    test('same seed produces identical tick sequence', () => {
      // Create two managers with same seed
      const mgr1 = new TickManager(12345);
      mgr1.addAgent('hero');
      mgr1.addAgent('npc1');

      const mgr2 = new TickManager(12345);
      mgr2.addAgent('hero');
      mgr2.addAgent('npc1');

      // Run 10 ticks on both
      mgr1.runTicks(10);
      mgr2.runTicks(10);

      // Get final states
      const state1 = mgr1.getState();
      const state2 = mgr2.getState();

      // Should be identical
      expect(state1.tick).toBe(state2.tick);
      expect(state1.tick).toBe(10);
    });

    test('same seed produces same world field values', () => {
      const mgr1 = new TickManager(54321);
      mgr1.addAgent('hero');
      mgr1.runTicks(20);

      const mgr2 = new TickManager(54321);
      mgr2.addAgent('hero');
      mgr2.runTicks(20);

      const state1 = mgr1.getState();
      const state2 = mgr2.getState();

      expect(state1.fields.fire).toBe(state2.fields.fire);
      expect(state1.fields.water).toBe(state2.fields.water);
      expect(state1.fields.earth).toBe(state2.fields.earth);
      expect(state1.fields.arcane).toBe(state2.fields.arcane);
    });

    test('same seed produces same contract history', () => {
      const mgr1 = new TickManager(999);
      mgr1.addAgent('hero');
      mgr1.runTicks(5);

      const mgr2 = new TickManager(999);
      mgr2.addAgent('hero');
      mgr2.runTicks(5);

      const hist1 = mgr1.contract.getHistory();
      const hist2 = mgr2.contract.getHistory();

      expect(hist1).toHaveLength(hist2.length);
      
      // Actions should match
      hist1.forEach((trace, i) => {
        expect(trace.intent.action).toBe(hist2[i].intent.action);
        expect(trace.executed).toBe(hist2[i].executed);
      });
    });

  });

  describe('Multi-agent determinism', () => {

    test('10 agents deterministic over 20 ticks', () => {
      const mgr1 = new TickManager(7777);
      for (let i = 0; i < 10; i++) {
        mgr1.addAgent(`agent_${i}`);
      }
      mgr1.runTicks(20);

      const mgr2 = new TickManager(7777);
      for (let i = 0; i < 10; i++) {
        mgr2.addAgent(`agent_${i}`);
      }
      mgr2.runTicks(20);

      const state1 = mgr1.getState();
      const state2 = mgr2.getState();

      expect(state1).toEqual(state2);
    });

  });

  describe('Long-run determinism', () => {

    test('100 ticks deterministic', () => {
      const mgr1 = new TickManager(111);
      mgr1.addAgent('hero');
      mgr1.runTicks(100);

      const mgr2 = new TickManager(111);
      mgr2.addAgent('hero');
      mgr2.runTicks(100);

      expect(mgr1.getState()).toEqual(mgr2.getState());
    });

    test('1000 ticks deterministic', () => {
      const mgr1 = new TickManager(2222);
      mgr1.addAgent('hero');
      mgr1.runTicks(1000);

      const mgr2 = new TickManager(2222);
      mgr2.addAgent('hero');
      mgr2.runTicks(1000);

      const state1 = mgr1.getState();
      const state2 = mgr2.getState();

      expect(state1.tick).toBe(state2.tick);
      expect(state1.fields).toEqual(state2.fields);
    });

  });

  describe('Determinism with varied seeds', () => {

    test('seed 0 is deterministic', () => {
      const mgr1 = new TickManager(0);
      mgr1.addAgent('hero');
      mgr1.runTicks(10);

      const mgr2 = new TickManager(0);
      mgr2.addAgent('hero');
      mgr2.runTicks(10);

      expect(mgr1.getState()).toEqual(mgr2.getState());
    });

    test('large seed is deterministic', () => {
      const mgr1 = new TickManager(999999999);
      mgr1.addAgent('hero');
      mgr1.runTicks(10);

      const mgr2 = new TickManager(999999999);
      mgr2.addAgent('hero');
      mgr2.runTicks(10);

      expect(mgr1.getState()).toEqual(mgr2.getState());
    });

  });

  describe('Determinism does not leak between runs', () => {

    test('previous tick manager state does not affect new one', () => {
      const mgr1 = new TickManager(555);
      mgr1.addAgent('hero');
      mgr1.runTicks(50);

      // Create new manager with same seed - should get same result as fresh
      const mgr2 = new TickManager(555);
      mgr2.addAgent('hero');
      mgr2.runTicks(50);

      // Even though mgr1 ran first, mgr2 should match
      expect(mgr2.getState()).toEqual(mgr1.getState());
    });

  });

});
