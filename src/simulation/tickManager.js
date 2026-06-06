const { world } = require('./worldField');
const { getAvailableActions } = require('./actions');
const { ACTION_REGISTRY } = require('./actionRegistry');
const { decayAgentMemory } = require('./memoryDecay');
const { ensureMemory, recallMemories, recordActionOutcome } = require('./memorySystem');
const { advanceNeeds, evaluateNeeds } = require('./needSystem');
const { generateIntents, resolveIntent } = require('./intentGenerator');

const actionRegistry = new Set(ACTION_REGISTRY);

function perceive(npc, worldObj = world) {
  return {
    field: worldObj.getField(npc.location),
    nearbyEvents: worldObj.getRecentEvents(npc.location),
    self: {
      id: npc.id,
      role: npc.role,
      location: npc.location,
      mana: npc.mana,
      needs: npc.needs
    }
  };
}

function applyActionEffects(action, npc, area) {
  if (action.effects && action.effects.manaChange) {
    const delta = action.effects.manaChange.current || 0;
    npc.mana.current = Math.max(0, Math.min(npc.mana.capacity, npc.mana.current + delta));
  }

  if (action.effects && action.effects.fieldChange) {
    for (const key of Object.keys(action.effects.fieldChange)) {
      area.field[key] = (area.field[key] || 0) + action.effects.fieldChange[key];
    }
  }
}

function updateManaAfterAction(npc, action, field) {
  npc.mana.current = Math.max(
    0,
    Math.min(npc.mana.capacity, npc.mana.current + ((field.arcane || 0) * 0.1))
  );

  const magicUsage = action.type === 'magic' ? 1 : 0;
  npc.mana.stability = Math.max(0, npc.mana.stability - (magicUsage * 0.05));
}

function worldFeedback(npc, area) {
  const leakage = Math.max(0, (npc.mana.current / (npc.mana.capacity || 1)) - 0.1);
  area.field.arcane = (area.field.arcane || 0) + (leakage * 0.01);
}

function filterRegisteredActions(actions) {
  const rejectedProposals = [];
  const registeredActions = actions.filter(action => {
    if (!actionRegistry.has(action.id)) {
      rejectedProposals.push(action.id);
      console.warn(`Action '${action.id}' proposed by AI/code is not registered in AI/action_registry.json - rejecting`);
      return false;
    }
    return true;
  });

  return { registeredActions, rejectedProposals };
}

function createRuntimeSnapshot(npc, needs, memories, intents, selectedIntent, needAfter) {
  npc.runtime = {
    lastNeeds: needs.profile,
    lastNeedUrgency: needs.urgency,
    lastMemories: memories.slice(0, 5),
    lastIntents: intents.map(intent => ({
      intent: intent.intent,
      score: intent.score,
      components: intent.components,
      reasonTrace: intent.reasonTrace
    })),
    lastSelectedIntent: selectedIntent ? selectedIntent.intent : null,
    lastNeedAfter: needAfter
  };
}

function simulateAgent(npc, worldObj) {
  ensureMemory(npc);

  const memoryDecay = decayAgentMemory(npc);
  const perception = perceive(npc, worldObj);
  const memories = recallMemories(npc, { location: npc.location });
  const needs = evaluateNeeds(npc);
  const rawActions = getAvailableActions(npc);
  const { registeredActions, rejectedProposals } = filterRegisteredActions(rawActions);
  const intents = generateIntents(npc, registeredActions, { perception, memories, needs });
  const selectedIntent = resolveIntent(intents);
  const selected = selectedIntent ? selectedIntent.action : null;
  const area = worldObj.areas.get(npc.location);

  const manaBefore = Object.assign({}, npc.mana);
  let actionRejected = !selected && rejectedProposals.length > 0;
  let rejectionReason = actionRejected ? `Action '${rejectedProposals[0]}' not registered` : null;
  const memoryUpdates = [];

  if (selected) {
    if (!actionRegistry.has(selected.id)) {
      actionRejected = true;
      rejectionReason = 'action-not-registered';
      console.warn(`Rejected execution of unregistered action '${selected.id}' for ${npc.id}`);
    } else {
      applyActionEffects(selected, npc, area);
      updateManaAfterAction(npc, selected, perception.field);
      recordActionOutcome(npc, selected.id, worldObj.tick || 0, 8);
      memoryUpdates.push({ type: 'success', action: selected.id, value: 8 });
      worldFeedback(npc, area);
    }
  }

  const manaAfter = Object.assign({}, npc.mana);
  const needAfter = advanceNeeds(npc);
  createRuntimeSnapshot(npc, needs, memories, intents, selectedIntent, needAfter);

  return {
    agentId: npc.id,
    actionSelected: selected ? selected.id : null,
    scoreBreakdown: selectedIntent ? { ...selectedIntent.components, total: selectedIntent.score } : null,
    actionRegistered: selected ? actionRegistry.has(selected.id) : null,
    actionRejected,
    rejectionReason,
    perception,
    memoryRecall: memories,
    memoryDecay,
    needProfile: needs.profile,
    needUrgency: needs.urgency,
    candidateIntents: intents.map(intent => ({
      intent: intent.intent,
      score: intent.score,
      components: intent.components,
      reasonTrace: intent.reasonTrace
    })),
    resolutionTrace: selectedIntent ? {
      selectedAction: selectedIntent.intent,
      certainty: selectedIntent.score,
      reasonTrace: selectedIntent.reasonTrace,
      rejectedIntents: intents
        .filter(intent => intent.intent !== selectedIntent.intent)
        .map(intent => ({ action: intent.intent, reason: `lower score ${intent.score.toFixed(2)}` }))
    } : null,
    memoryUpdates,
    manaBefore,
    manaAfter,
    position: npc.location
  };
}

function tickManager(npcs, worldObj, traceCollector) {
  const log = [];
  worldObj.tick = (worldObj.tick || 0) + 1;

  if (traceCollector && typeof traceCollector.beginTick === 'function') {
    traceCollector.beginTick(worldObj.tick, worldObj);
  }

  for (const npc of npcs) {
    const agentTrace = simulateAgent(npc, worldObj);

    if (traceCollector && typeof traceCollector.recordAgent === 'function') {
      traceCollector.recordAgent(agentTrace);
    }

    log.push({
      npc: agentTrace.agentId,
      action: agentTrace.actionSelected,
      score: agentTrace.scoreBreakdown ? agentTrace.scoreBreakdown.total : null
    });
  }

  if (traceCollector && typeof traceCollector.endTick === 'function') {
    traceCollector.endTick();
  }

  return log;
}

module.exports = { tickManager, simulateAgent };
