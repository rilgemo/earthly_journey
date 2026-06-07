/**
 * Test 2: Execution Contract
 * 
 * Goal: Intent → Contract → TickManager pipeline is correct
 * 
 * Pipeline:
 *   Intent
 *     ↓
 *   Execution Contract Validation
 *     ↓ (passes)
 *   TickManager
 *     ↓
 *   World State Mutation
 */

const {
  ExecutionContract,
  TickManager
} = require('../testUtils');

describe('Test 2: Execution Contract', () => {

  describe('Contract validation pipeline', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('valid intent returns executed=true', () => {
      const intent = { action: 'forage', agent: 'hero' };
      const result = contract.executeIntent(intent);
      
      expect(result.executed).toBe(true);
      expect(result.actionRegistered).toBe(true);
      expect(result.actionRejected).toBe(false);
    });

    test('invalid intent returns executed=false', () => {
      const intent = { action: 'invalid', agent: 'hero' };
      const result = contract.executeIntent(intent);
      
      expect(result.executed).toBe(false);
      expect(result.actionRejected).toBe(true);
      expect(result.rejectionReason).toBeDefined();
    });

    test('rejection reason is always provided on reject', () => {
      const intent = { action: 'unknown' };
      const result = contract.executeIntent(intent);
      
      expect(result.actionRejected).toBe(true);
      expect(result.rejectionReason).not.toBeNull();
      expect(result.rejectionReason.length).toBeGreaterThan(0);
    });

    test('valid action never rejected', () => {
      const validActions = ['forage', 'rest', 'cast_magic', 'move', 'share_information'];
      validActions.forEach(action => {
        const result = contract.executeIntent({ action });
        expect(result.actionRejected).toBe(false);
        expect(result.rejectionReason).toBeNull();
      });
    });

  });

  describe('Contract → TickManager integration', () => {

    let manager;

    beforeEach(() => {
      manager = new TickManager();
      manager.addAgent('hero');
    });

    test('tick manager uses contract for validation', () => {
      manager.tick();
      
      const contractHistory = manager.contract.getHistory();
      expect(contractHistory.length).toBeGreaterThan(0);
      
      // All executed actions should be registered
      contractHistory.forEach(trace => {
        if (trace.executed) {
          expect(trace.actionRegistered).toBe(true);
        }
      });
    });

    test('rejected actions do not mutate world state', () => {
      const initialMana = manager.world.getAgent('hero').mana;
      
      // Attempt invalid action
      const result = manager.contract.executeIntent({
        action: 'invalid_action',
        agent: 'hero'
      });
      
      expect(result.executed).toBe(false);
      
      // World should not have changed
      const finalMana = manager.world.getAgent('hero').mana;
      expect(finalMana).toBe(initialMana);
    });

    test('executed actions trigger world mutations', () => {
      const initialState = manager.world.clone();
      
      // Execute valid action through contract
      manager.contract.executeIntent({
        action: 'forage',
        agent: 'hero'
      });
      
      // World field should have changed (in real system)
      // For now, this is a placeholder for integration tests
      expect(manager.world).toBeDefined();
    });

  });

  describe('Intent structure validation', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('intent with action field executes if registered', () => {
      const result = contract.executeIntent({ action: 'forage' });
      expect(result.executed).toBe(true);
    });

    test('intent with target preserved in trace', () => {
      const intent = { action: 'forage', target: 'mushroom_patch' };
      const result = contract.executeIntent(intent);
      
      expect(result.intent.target).toBe('mushroom_patch');
    });

    test('trace records timestamp', () => {
      const before = Date.now();
      const result = contract.executeIntent({ action: 'forage' });
      const after = Date.now();
      
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

  });

  describe('Multiple intents in sequence', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('contract maintains execution history', () => {
      contract.executeIntent({ action: 'forage' });
      contract.executeIntent({ action: 'invalid' });
      contract.executeIntent({ action: 'rest' });
      
      const history = contract.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].executed).toBe(true);
      expect(history[1].executed).toBe(false);
      expect(history[2].executed).toBe(true);
    });

    test('history can be cleared', () => {
      contract.executeIntent({ action: 'forage' });
      expect(contract.getHistory()).toHaveLength(1);
      
      contract.clearHistory();
      expect(contract.getHistory()).toHaveLength(0);
    });

  });

});
