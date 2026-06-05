/**
 * Test 1: Action Registry Enforcement
 * 
 * Goal: Unknown actions never execute
 * 
 * Constraint:
 *   Unregistered Action === Permanent Rejection
 */

const {
  ACTION_REGISTRY,
  isRegisteredAction,
  ExecutionContract
} = require('../testUtils');

describe('Test 1: Action Registry Enforcement', () => {

  describe('isRegisteredAction()', () => {

    test('registered action "forage" passes', () => {
      expect(isRegisteredAction('forage')).toBe(true);
    });

    test('registered action "rest_camp" passes', () => {
      expect(isRegisteredAction('rest_camp')).toBe(true);
    });

    test('registered action "cast_spark" passes', () => {
      expect(isRegisteredAction('cast_spark')).toBe(true);
    });

    test('registered action "travel" passes', () => {
      expect(isRegisteredAction('travel')).toBe(true);
    });

    test('unregistered action "destroy_world" rejected', () => {
      expect(isRegisteredAction('destroy_world')).toBe(false);
    });

    test('unregistered action "cheat_gold" rejected', () => {
      expect(isRegisteredAction('cheat_gold')).toBe(false);
    });

    test('ACTION_REGISTRY is frozen at runtime', () => {
      expect(ACTION_REGISTRY).toEqual(['forage', 'rest_camp', 'cast_spark', 'travel']);
    });

  });

  describe('Execution Contract validation', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('valid registered action executes', () => {
      const result = contract.executeIntent({ action: 'forage' });
      expect(result.executed).toBe(true);
      expect(result.actionRegistered).toBe(true);
    });

    test('unregistered action rejected', () => {
      const result = contract.executeIntent({ action: 'illegal_action' });
      expect(result.executed).toBe(false);
      expect(result.actionRejected).toBe(true);
      expect(result.rejectionReason).toBeDefined();
    });

    test('rejection trace includes action name', () => {
      const result = contract.executeIntent({ action: 'hack_database' });
      expect(result.rejectionReason).toContain('hack_database');
    });

  });

  describe('Multiple actions', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('all valid actions execute', () => {
      const valid = ['forage', 'rest_camp', 'cast_spark', 'travel'];
      valid.forEach(action => {
        const result = contract.executeIntent({ action });
        expect(result.executed).toBe(true);
      });
    });

    test('history tracks all rejections', () => {
      contract.executeIntent({ action: 'forage' });        // ok
      contract.executeIntent({ action: 'bad_action' });    // reject
      contract.executeIntent({ action: 'rest_camp' });     // ok
      contract.executeIntent({ action: 'illegal' });       // reject

      const history = contract.getHistory();
      expect(history).toHaveLength(4);
      expect(history[1].actionRejected).toBe(true);
      expect(history[3].actionRejected).toBe(true);
    });

  });

});
