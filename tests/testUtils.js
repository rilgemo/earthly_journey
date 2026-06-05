/**
 * Test Utilities for Contract Test Suite
 * 
 * Provides common setup, fixtures, and helpers for all contract tests.
 */

const fs = require('fs');
const path = require('path');

// Action registry from AI/action_registry.json
const ACTION_REGISTRY = ["forage", "rest_camp", "cast_spark", "travel"];

/**
 * Validate if action is registered
 */
function isRegisteredAction(actionKey) {
  return ACTION_REGISTRY.includes(actionKey);
}

/**
 * Execution contract layer
 * Validates and executes intents
 */
class ExecutionContract {
  constructor() {
    this.history = [];
  }

  executeIntent(intent) {
    const trace = {
      actionRegistered: false,
      actionRejected: false,
      rejectionReason: null,
      executed: false,
      intent,
      timestamp: Date.now()
    };

    // Check if action is registered
    if (!isRegisteredAction(intent.action)) {
      trace.actionRejected = true;
      trace.rejectionReason = `Action '${intent.action}' not found in ACTION_REGISTRY`;
      this.history.push(trace);
      return { ...trace, executed: false };
    }

    trace.actionRegistered = true;

    // Additional validation could go here
    // For now, mark as executed
    trace.executed = true;
    this.history.push(trace);
    return { ...trace };
  }

  clearHistory() {
    this.history = [];
  }

  getHistory() {
    return this.history;
  }
}

/**
 * World state - simple container for testing
 */
class WorldState {
  constructor() {
    this.agents = new Map();
    this.fire = 0;
    this.water = 0;
    this.earth = 0;
    this.arcane = 0;
    this.tick = 0;
  }

  addAgent(id, mana = 100, maxMana = 100) {
    this.agents.set(id, {
      id,
      mana,
      maxMana,
      hp: 100,
      maxHp: 100,
      position: 'camp'
    });
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  updateAgentMana(id, delta) {
    const agent = this.getAgent(id);
    if (!agent) return false;
    agent.mana = Math.max(0, Math.min(agent.maxMana, agent.mana + delta));
    return true;
  }

  updateField(field, delta) {
    const MAX_FIELD = 1000;
    if (this[field] !== undefined) {
      this[field] = Math.max(0, Math.min(MAX_FIELD, this[field] + delta));
      return true;
    }
    return false;
  }

  validateState() {
    const issues = [];

    // Check mana bounds
    this.agents.forEach((agent, id) => {
      if (agent.mana < 0) {
        issues.push(`Agent ${id} mana negative: ${agent.mana}`);
      }
      if (agent.mana > agent.maxMana) {
        issues.push(`Agent ${id} mana exceeds max: ${agent.mana} > ${agent.maxMana}`);
      }
      if (isNaN(agent.mana)) {
        issues.push(`Agent ${id} mana is NaN`);
      }
    });

    // Check field bounds
    ['fire', 'water', 'earth', 'arcane'].forEach(field => {
      if (this[field] < 0) {
        issues.push(`Field ${field} negative: ${this[field]}`);
      }
      if (this[field] > 1000) {
        issues.push(`Field ${field} exceeds max: ${this[field]}`);
      }
      if (isNaN(this[field])) {
        issues.push(`Field ${field} is NaN`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  clone() {
    const cloned = new WorldState();
    cloned.agents = new Map(this.agents);
    cloned.fire = this.fire;
    cloned.water = this.water;
    cloned.earth = this.earth;
    cloned.arcane = this.arcane;
    cloned.tick = this.tick;
    return cloned;
  }
}

/**
 * Simple deterministic PRNG for testing
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
    this.m = 0x80000000;
    this.a = 1103515245;
    this.c = 12345;
  }

  next() {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextElement(array) {
    return array[this.nextInt(0, array.length - 1)];
  }
}

/**
 * Tick manager - drives simulation forward
 */
class TickManager {
  constructor(seed = 12345) {
    this.rng = new SeededRandom(seed);
    this.contract = new ExecutionContract();
    this.world = new WorldState();
    this.agents = [];
  }

  addAgent(id, mana = 100) {
    this.world.addAgent(id, mana, mana);
    this.agents.push(id);
  }

  tick() {
    this.world.tick += 1;

    // Each agent makes an action
    for (const agentId of this.agents) {
      const actionKey = this.rng.nextElement(ACTION_REGISTRY);
      const result = this.contract.executeIntent({
        action: actionKey,
        agent: agentId
      });

      if (result.executed) {
        // Simulate action effects
        this.world.updateAgentMana(agentId, -5);
        this.world.updateField('fire', this.rng.nextInt(-2, 5));
        this.world.updateField('water', this.rng.nextInt(-2, 5));
      }
    }

    // World field decay
    this.world.updateField('fire', -1);
    this.world.updateField('water', -1);
  }

  runTicks(count) {
    for (let i = 0; i < count; i++) {
      this.tick();
    }
  }

  getState() {
    return {
      tick: this.world.tick,
      agents: Array.from(this.world.agents.values()),
      fields: {
        fire: this.world.fire,
        water: this.world.water,
        earth: this.world.earth,
        arcane: this.world.arcane
      }
    };
  }
}

module.exports = {
  ACTION_REGISTRY,
  isRegisteredAction,
  ExecutionContract,
  WorldState,
  SeededRandom,
  TickManager
};
