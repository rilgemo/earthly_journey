/**
 * Test 5: Mana Conservation
 * 
 * Goal: Agent mana never goes negative or infinite
 * 
 * Contract:
 *   0 ≤ agent.mana ≤ agent.maxMana
 */

const {
  WorldState,
  TickManager
} = require('../testUtils');

describe('Test 5: Mana Conservation', () => {

  describe('Mana bounds in WorldState', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
      world.addAgent('hero', 50, 100);
    });

    test('mana never goes below 0', () => {
      const agent = world.getAgent('hero');
      expect(agent.mana).toBeGreaterThanOrEqual(0);

      // Try to drain more than available
      world.updateAgentMana('hero', -100);
      expect(world.getAgent('hero').mana).toBeGreaterThanOrEqual(0);
      expect(world.getAgent('hero').mana).toBe(0);
    });

    test('mana never exceeds maxMana', () => {
      const agent = world.getAgent('hero');
      expect(agent.mana).toBeLessThanOrEqual(agent.maxMana);

      // Try to restore more than max
      world.updateAgentMana('hero', 200);
      expect(world.getAgent('hero').mana).toBeLessThanOrEqual(100);
      expect(world.getAgent('hero').mana).toBe(100);
    });

    test('mana clamping preserves valid state', () => {
      world.updateAgentMana('hero', -50);  // 50 → 0
      expect(world.getAgent('hero').mana).toBe(0);

      world.updateAgentMana('hero', 200); // 0 → 100
      expect(world.getAgent('hero').mana).toBe(100);

      world.updateAgentMana('hero', -30); // 100 → 70
      expect(world.getAgent('hero').mana).toBe(70);
    });

    test('fractional mana is handled correctly', () => {
      world.updateAgentMana('hero', -5.5);
      const mana = world.getAgent('hero').mana;
      
      expect(mana).toBeGreaterThanOrEqual(0);
      expect(mana).toBeLessThanOrEqual(100);
    });

  });

  describe('Multiple agents mana bounds', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
      for (let i = 0; i < 10; i++) {
        world.addAgent(`agent_${i}`, 50, 100);
      }
    });

    test('all agents maintain mana bounds', () => {
      for (let i = 0; i < 10; i++) {
        world.updateAgentMana(`agent_${i}`, -30);
      }

      world.agents.forEach((agent, id) => {
        expect(agent.mana).toBeGreaterThanOrEqual(0);
        expect(agent.mana).toBeLessThanOrEqual(agent.maxMana);
      });
    });

    test('extreme drains respected', () => {
      for (let i = 0; i < 10; i++) {
        world.updateAgentMana(`agent_${i}`, -999999);
      }

      world.agents.forEach((agent, id) => {
        expect(agent.mana).toBe(0);
      });
    });

  });

  describe('TickManager mana conservation', () => {

    test('ticks maintain mana bounds for single agent', () => {
      const manager = new TickManager();
      manager.addAgent('hero', 100);
      manager.runTicks(50);

      const agent = manager.world.getAgent('hero');
      expect(agent.mana).toBeGreaterThanOrEqual(0);
      expect(agent.mana).toBeLessThanOrEqual(agent.maxMana);
    });

    test('ticks maintain mana bounds for multiple agents', () => {
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`, 100);
      }
      manager.runTicks(100);

      manager.world.agents.forEach((agent, id) => {
        expect(agent.mana).toBeGreaterThanOrEqual(0);
        expect(agent.mana).toBeLessThanOrEqual(agent.maxMana);
        expect(isNaN(agent.mana)).toBe(false);
      });
    });

    test('long runs (1000 ticks) maintain bounds', () => {
      const manager = new TickManager();
      manager.addAgent('hero', 100);
      manager.runTicks(1000);

      const agent = manager.world.getAgent('hero');
      expect(agent.mana).toBeGreaterThanOrEqual(0);
      expect(agent.mana).toBeLessThanOrEqual(100);
    });

  });

  describe('Mana state validation', () => {

    test('world state validation catches mana issues', () => {
      const world = new WorldState();
      world.addAgent('hero', 50, 100);

      let validation = world.validateState();
      expect(validation.valid).toBe(true);

      // Manually break it (for testing)
      world.getAgent('hero').mana = -1;
      validation = world.validateState();
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    test('NaN detection works', () => {
      const world = new WorldState();
      world.addAgent('hero', 50, 100);
      world.getAgent('hero').mana = NaN;

      const validation = world.validateState();
      expect(validation.valid).toBe(false);
      expect(validation.issues[0]).toContain('NaN');
    });

  });

  describe('Mana operations are atomic', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
      world.addAgent('hero', 50, 100);
    });

    test('failed update preserves state', () => {
      const initial = world.getAgent('hero').mana;
      
      // Update non-existent agent
      const result = world.updateAgentMana('nonexistent', -10);
      
      expect(result).toBe(false);
      expect(world.getAgent('hero').mana).toBe(initial);
    });

    test('sequential updates are cumulative', () => {
      world.updateAgentMana('hero', -10);
      expect(world.getAgent('hero').mana).toBe(40);
      
      world.updateAgentMana('hero', -15);
      expect(world.getAgent('hero').mana).toBe(25);
      
      world.updateAgentMana('hero', 30);
      expect(world.getAgent('hero').mana).toBe(55);
    });

  });

  describe('Mana arithmetic correctness', () => {

    let world;

    beforeEach(() => {
      world = new WorldState();
      world.addAgent('hero', 100, 200);
    });

    test('drain reduces mana correctly', () => {
      world.updateAgentMana('hero', -25);
      expect(world.getAgent('hero').mana).toBe(75);
      
      world.updateAgentMana('hero', -25);
      expect(world.getAgent('hero').mana).toBe(50);
    });

    test('restore increases mana correctly', () => {
      world.getAgent('hero').mana = 50;  // Reset to 50
      
      world.updateAgentMana('hero', 25);
      expect(world.getAgent('hero').mana).toBe(75);
      
      world.updateAgentMana('hero', 50);
      expect(world.getAgent('hero').mana).toBe(125);
    });

    test('zero delta preserves value', () => {
      const initial = world.getAgent('hero').mana;
      world.updateAgentMana('hero', 0);
      expect(world.getAgent('hero').mana).toBe(initial);
    });

  });

});
