/**
 * Test 7: Smoke Test
 * 
 * Goal: Daily sanity check
 * 
 * Contract:
 *   20 ticks + 10 agents
 *   → no crash
 *   → no unregistered actions
 *   → no NaN
 */

const {
  TickManager,
  ACTION_REGISTRY
} = require('../testUtils');

describe('Test 7: Smoke Test (Daily Sanity Check)', () => {

  describe('Basic smoke test', () => {

    test('10 agents, 20 ticks completes without error', () => {
      const manager = new TickManager(12345);
      
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }

      expect(() => {
        manager.runTicks(20);
      }).not.toThrow();
    });

  });

  describe('No unregistered actions executed', () => {

    test('all executed actions are registered', () => {
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      const history = manager.contract.getHistory();
      history.forEach(trace => {
        if (trace.executed) {
          expect(ACTION_REGISTRY).toContain(trace.intent.action);
        }
      });
    });

    test('no action bypasses registry check', () => {
      const manager = new TickManager(999);
      manager.addAgent('hero');
      manager.runTicks(50);

      const history = manager.contract.getHistory();
      expect(history.length).toBeGreaterThan(0);

      history.forEach(trace => {
        // If executed, must be registered
        if (trace.executed) {
          expect(trace.actionRegistered).toBe(true);
        }
        // If not registered, must be rejected
        if (!trace.actionRegistered) {
          expect(trace.executed).toBe(false);
          expect(trace.actionRejected).toBe(true);
        }
      });
    });

  });

  describe('No NaN values in world state', () => {

    test('mana values are never NaN', () => {
      const manager = new TickManager(5555);
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      manager.world.agents.forEach((agent, id) => {
        expect(isNaN(agent.mana)).toBe(false);
        expect(typeof agent.mana).toBe('number');
      });
    });

    test('field values are never NaN', () => {
      const manager = new TickManager(7777);
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      const state = manager.getState();
      Object.entries(state.fields).forEach(([field, value]) => {
        expect(isNaN(value)).toBe(false);
        expect(typeof value).toBe('number');
      });
    });

    test('no NaN in entire world state', () => {
      const manager = new TickManager(2222);
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      const validation = manager.world.validateState();
      const nanIssues = validation.issues.filter(issue => issue.includes('NaN'));
      expect(nanIssues).toHaveLength(0);
    });

  });

  describe('World state validity', () => {

    test('world state is valid after smoke test', () => {
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      const validation = manager.world.validateState();
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('all agents maintain valid bounds', () => {
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      manager.world.agents.forEach((agent, id) => {
        expect(agent.mana).toBeGreaterThanOrEqual(0);
        expect(agent.mana).toBeLessThanOrEqual(agent.maxMana);
        expect(agent.hp).toBeGreaterThanOrEqual(0);
        expect(agent.hp).toBeLessThanOrEqual(agent.maxHp);
      });
    });

  });

  describe('No exceptions or crashes', () => {

    test('complex scenario: 10 agents, 50 ticks', () => {
      expect(() => {
        const manager = new TickManager(111);
        for (let i = 0; i < 10; i++) {
          manager.addAgent(`agent_${i}`, 100);
        }
        manager.runTicks(50);
      }).not.toThrow();
    });

    test('stress scenario: 20 agents, 100 ticks', () => {
      expect(() => {
        const manager = new TickManager(222);
        for (let i = 0; i < 20; i++) {
          manager.addAgent(`agent_${i}`, 100);
        }
        manager.runTicks(100);
      }).not.toThrow();
    });

    test('edge case: 1 agent, 1000 ticks', () => {
      expect(() => {
        const manager = new TickManager(333);
        manager.addAgent('hero', 100);
        manager.runTicks(1000);
      }).not.toThrow();
    });

  });

  describe('Contract integrity', () => {

    test('execution contract history is complete', () => {
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      const history = manager.contract.getHistory();
      expect(history.length).toBe(200); // 10 agents x 20 ticks, 1 action per agent per tick

      history.forEach(trace => {
        expect(trace).toHaveProperty('executed');
        expect(trace).toHaveProperty('actionRegistered');
        expect(trace).toHaveProperty('actionRejected');
        expect(trace).toHaveProperty('rejectionReason');
        expect(trace).toHaveProperty('intent');
        expect(trace).toHaveProperty('timestamp');
      });
    });

  });

  describe('Determinism check', () => {

    test('same seed produces same result in smoke test', () => {
      const mgr1 = new TickManager(12345);
      for (let i = 0; i < 10; i++) {
        mgr1.addAgent(`agent_${i}`);
      }
      mgr1.runTicks(20);

      const mgr2 = new TickManager(12345);
      for (let i = 0; i < 10; i++) {
        mgr2.addAgent(`agent_${i}`);
      }
      mgr2.runTicks(20);

      expect(mgr1.getState()).toEqual(mgr2.getState());
    });

  });

  describe('Performance baseline', () => {

    test('smoke test completes in reasonable time', () => {
      const start = Date.now();
      
      const manager = new TickManager();
      for (let i = 0; i < 10; i++) {
        manager.addAgent(`agent_${i}`);
      }
      manager.runTicks(20);

      const elapsed = Date.now() - start;
      
      // Should complete well under 5 seconds
      expect(elapsed).toBeLessThan(5000);
    });

  });

});
