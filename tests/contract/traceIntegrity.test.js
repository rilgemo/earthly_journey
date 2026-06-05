/**
 * Test 3: Trace Integrity
 * 
 * Goal: Every rejection is traceable
 * 
 * Contract:
 *   actionRejected = true  ===  rejectionReason ≠ null
 */

const {
  ExecutionContract
} = require('../testUtils');

describe('Test 3: Trace Integrity', () => {

  describe('Rejection trace completeness', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('rejected action includes rejection reason', () => {
      const result = contract.executeIntent({ action: 'invalid_action' });
      
      expect(result.actionRejected).toBe(true);
      expect(result.rejectionReason).not.toBeNull();
      expect(typeof result.rejectionReason).toBe('string');
      expect(result.rejectionReason.length).toBeGreaterThan(0);
    });

    test('all rejected traces in history have reasons', () => {
      contract.executeIntent({ action: 'forage' });           // valid
      contract.executeIntent({ action: 'hack1' });            // invalid
      contract.executeIntent({ action: 'rest_camp' });        // valid
      contract.executeIntent({ action: 'hack2' });            // invalid
      contract.executeIntent({ action: 'invalid_action' });   // invalid

      const history = contract.getHistory();
      history.forEach((trace, idx) => {
        if (trace.actionRejected) {
          expect(trace.rejectionReason).not.toBeNull();
          expect(trace.rejectionReason.length).toBeGreaterThan(0);
        }
      });
    });

    test('valid action has no rejection reason', () => {
      const result = contract.executeIntent({ action: 'forage' });
      
      expect(result.actionRejected).toBe(false);
      expect(result.rejectionReason).toBeNull();
    });

  });

  describe('Trace required fields', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('valid trace contains all required fields', () => {
      const result = contract.executeIntent({ action: 'forage' });
      
      expect(result).toHaveProperty('actionRegistered');
      expect(result).toHaveProperty('actionRejected');
      expect(result).toHaveProperty('rejectionReason');
      expect(result).toHaveProperty('executed');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('timestamp');
    });

    test('rejected trace contains all required fields', () => {
      const result = contract.executeIntent({ action: 'invalid' });
      
      expect(result).toHaveProperty('actionRegistered');
      expect(result).toHaveProperty('actionRejected');
      expect(result).toHaveProperty('rejectionReason');
      expect(result).toHaveProperty('executed');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('timestamp');
    });

    test('trace contains original intent', () => {
      const intent = { action: 'forage', agent: 'hero', target: 'mushroom' };
      const result = contract.executeIntent(intent);
      
      expect(result.intent).toEqual(intent);
    });

  });

  describe('Trace consistency invariants', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('actionRejected and actionRegistered are mutually exclusive', () => {
      contract.executeIntent({ action: 'forage' });
      contract.executeIntent({ action: 'invalid' });

      const history = contract.getHistory();
      history.forEach(trace => {
        const isRejected = trace.actionRejected;
        const isRegistered = trace.actionRegistered;
        
        // Can't be both
        expect(!(isRejected && isRegistered)).toBe(true);
      });
    });

    test('executed=true only when not rejected', () => {
      contract.executeIntent({ action: 'forage' });        // should execute
      contract.executeIntent({ action: 'invalid' });       // should reject

      const history = contract.getHistory();
      expect(history[0].executed).toBe(true);
      expect(history[0].actionRejected).toBe(false);
      
      expect(history[1].executed).toBe(false);
      expect(history[1].actionRejected).toBe(true);
    });

    test('rejection reason is non-empty string', () => {
      const invalidActions = ['bad', 'hack', 'cheat', 'exploit'];
      
      invalidActions.forEach(action => {
        const result = contract.executeIntent({ action });
        if (result.actionRejected) {
          expect(typeof result.rejectionReason).toBe('string');
          expect(result.rejectionReason.trim().length).toBeGreaterThan(0);
        }
      });
    });

  });

  describe('History integrity', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('history is ordered chronologically', () => {
      contract.executeIntent({ action: 'forage' });
      contract.executeIntent({ action: 'rest_camp' });
      contract.executeIntent({ action: 'invalid' });

      const history = contract.getHistory();
      let lastTimestamp = 0;
      
      history.forEach(trace => {
        expect(trace.timestamp).toBeGreaterThanOrEqual(lastTimestamp);
        lastTimestamp = trace.timestamp;
      });
    });

    test('clearing history removes all traces', () => {
      contract.executeIntent({ action: 'forage' });
      contract.executeIntent({ action: 'invalid' });
      expect(contract.getHistory()).toHaveLength(2);
      
      contract.clearHistory();
      expect(contract.getHistory()).toHaveLength(0);
    });

  });

  describe('Rejection reason content', () => {

    let contract;

    beforeEach(() => {
      contract = new ExecutionContract();
    });

    test('rejection reason mentions the invalid action', () => {
      const result = contract.executeIntent({ action: 'exploit_glitch' });
      
      expect(result.rejectionReason).toContain('exploit_glitch');
    });

    test('rejection reason explains why it was rejected', () => {
      const result = contract.executeIntent({ action: 'unknown' });
      
      // Should mention registry or validation failure
      const reason = result.rejectionReason.toLowerCase();
      expect(
        reason.includes('not found') ||
        reason.includes('not registered') ||
        reason.includes('unknown') ||
        reason.includes('invalid')
      ).toBe(true);
    });

  });

});
