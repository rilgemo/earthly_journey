const { world } = require('./worldField');
const { getAvailableActions } = require('./actions');
// Load the canonical action registry (Execution Contract enforcement)
let actionRegistryList = [];
try {
  actionRegistryList = require('../../AI/action_registry.json');
} catch (e) {
  console.warn('Action registry not found or invalid: AI/action_registry.json', e && e.message);
}
const actionRegistry = new Set(actionRegistryList || []);

function perceive(npc) {
  return {
    field: world.getField(npc.location),
    nearbyEvents: world.getRecentEvents(npc.location)
  };
}

function evaluateNeeds(npc) {
  const hungerWeight = 1.0, restWeight = 0.8, curiosityWeight = 0.3;
  return (hungerWeight * npc.needs.hunger) + (restWeight * npc.needs.rest) + (curiosityWeight * npc.needs.curiosity);
}

function evaluateFieldMatch(npc, field) {
  let sum = 0;
  for (const k of ['fire','water','earth','arcane']) {
    sum += (npc.affinities[k] || 0) * (field[k] || 0);
  }
  return sum;
}

function evaluateManaResonance(npc, field) {
  let dominant = 'arcane';
  let max = -Infinity;
  for (const k of ['fire','water','earth','arcane']) {
    if ((field[k]||0) > max) { max = field[k]; dominant = k; }
  }
  return (npc.mana.stability || 0) * ((npc.mana.affinity && npc.mana.affinity[dominant]) || 0);
}

function scoreActionBreakdown(npc, action, needScore, fieldMatch, manaRes) {
  const bias = npc.memory.bias[action.id] || 0;
  const randomness = (Math.random()-0.5)*0.1;
  const needComponent = needScore;
  const fieldComponent = fieldMatch;
  const manaComponent = manaRes;
  const memoryComponent = bias;
  const total = action.baseUtility + needComponent + fieldComponent + manaComponent + memoryComponent + randomness;
  return {
    needScore: needComponent,
    fieldScore: fieldComponent,
    manaScore: manaComponent,
    memoryScore: memoryComponent,
    randomness: randomness,
    total
  };
}

function applyActionEffects(action, npc, area) {
  if (action.effects && action.effects.manaChange) {
    const delta = action.effects.manaChange.current || 0;
    npc.mana.current = Math.max(0, Math.min(npc.mana.capacity, npc.mana.current + delta));
  }
  if (action.effects && action.effects.fieldChange) {
    for (const k of Object.keys(action.effects.fieldChange)) {
      area.field[k] = (area.field[k] || 0) + action.effects.fieldChange[k];
    }
  }
}

function updateMemory(npc, actionId, reward) {
  npc.memory.recentEvents.push(`${Date.now()}: did ${actionId}`);
  if (npc.memory.recentEvents.length > 20) npc.memory.recentEvents.shift();
  npc.memory.bias[actionId] = (npc.memory.bias[actionId] || 0) + (0.1 * reward);
}

function updateManaAfterAction(npc, action, field) {
  npc.mana.current = Math.max(0, Math.min(npc.mana.capacity, npc.mana.current + (field.arcane || 0)*0.1));
  const magicUsage = (action.type === 'magic') ? 1 : 0;
  npc.mana.stability = Math.max(0, npc.mana.stability - (magicUsage*0.05));
}

function worldFeedback(npc, area) {
  const leakage = Math.max(0, (npc.mana.current / (npc.mana.capacity||1)) - 0.1);
  area.field.arcane = (area.field.arcane || 0) + leakage*0.01;
}

function simulateAgent(npc, worldObj) {
  const perception = perceive(npc);
  const needScore = evaluateNeeds(npc);
  const fieldMatch = evaluateFieldMatch(npc, perception.field);
  const manaRes = evaluateManaResonance(npc, perception.field);
  // Only consider actions present in the canonical registry — enforce execution contract
  const rawActions = getAvailableActions(npc);
  const actions = rawActions.filter(a => {
    if (!actionRegistry.has(a.id)) {
      console.warn(`Action '${a.id}' proposed by AI/code is not registered in AI/action_registry.json — rejecting`);
      return false;
    }
    return true;
  });

  const breakdowns = {};
  for (const a of actions) {
    breakdowns[a.id] = scoreActionBreakdown(npc, a, needScore, fieldMatch, manaRes);
  }

  const selectedAction = actions.length ? actions.reduce((best, a) => {
    if (!best) return a;
    return (breakdowns[a.id].total > breakdowns[best.id].total) ? a : best;
  }, null) : null;

  const selectedActionId = selectedAction ? selectedAction.id : null;
  const selected = selectedAction;
  const area = worldObj.areas.get(npc.location);

  const manaBefore = Object.assign({}, npc.mana);
  let actionRejected = false;
  let rejectionReason = null;
  if (selected) {
    if (!actionRegistry.has(selected.id)) {
      // This should not happen due to filtering above, but guard defensively
      actionRejected = true;
      rejectionReason = 'action-not-registered';
      console.warn(`Rejected execution of unregistered action '${selected.id}' for ${npc.id}`);
    } else {
      applyActionEffects(selected, npc, area);
      updateManaAfterAction(npc, selected, perception.field);
      updateMemory(npc, selected.id, 1);
      worldFeedback(npc, area);
    }
  }
  const manaAfter = Object.assign({}, npc.mana);

  // natural need increases
  npc.needs.hunger = Math.min(1, npc.needs.hunger + 0.01);
  npc.needs.rest = Math.min(1, npc.needs.rest + 0.005);

  return {
    agentId: npc.id,
    actionSelected: selected ? selected.id : null,
    scoreBreakdown: selected ? breakdowns[selected.id] : null,
    actionRegistered: selected ? actionRegistry.has(selected.id) : null,
    actionRejected,
    rejectionReason,
    manaBefore,
    manaAfter,
    position: npc.location
  };
}

function tickManager(npcs, worldObj, traceCollector) {
  const log = [];
  if (traceCollector && typeof traceCollector.beginTick === 'function') {
    traceCollector.beginTick((worldObj.tick||0)+1, worldObj);
  }
  for (const npc of npcs) {
    const agentTrace = simulateAgent(npc, worldObj);
    if (traceCollector && typeof traceCollector.recordAgent === 'function') {
      traceCollector.recordAgent(agentTrace);
    }
    log.push({ npc: agentTrace.agentId, action: agentTrace.actionSelected, score: agentTrace.scoreBreakdown ? agentTrace.scoreBreakdown.total : null });
  }
  if (traceCollector && typeof traceCollector.endTick === 'function') {
    traceCollector.endTick();
  }
  return log;
}

module.exports = { tickManager, simulateAgent };