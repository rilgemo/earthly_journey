const { world } = require('./worldField');
const { getAvailableActions } = require('./actions');
const { ACTION_REGISTRY } = require('./actionRegistry');
const { decayAgentMemory } = require('./memoryDecay');
const { ensureMemory, recallMemories, recordActionOutcome, recordMemory } = require('./memorySystem');
const { advanceNeeds, evaluateNeeds } = require('./needSystem');
const intentPipeline = require('./intent/intentPipeline');
const { createInfluenceField } = require('./influenceField');
const { prepareInformationTransfer } = require('./communicationSystem');
const { computeActionYield } = require('./actionYield/actionYieldEngine');
const { runResourceFlowTick } = require('./resourceFlow/resourceFlowEngine');
const { createDecisionTrace } = require('./decisionTrace');
const { createFieldDelta, createFieldState } = require('./elementalField/fieldState');
const { runFieldDynamicsTick } = require('./elementalField/fieldDynamicsTick');
const { emergenceTickHook } = require('./coupledEmergence/emergenceTickHook');
const { createStabilityGains, runStabilityController } = require('./stability/stabilityController');
const { applySkillGain } = require('./skills/skillGain');
const { learnKnowledge, learnKnowledgeFromMemories } = require('./skills/knowledgeSystem');
const {
  applyPostTickIdentity,
  beginIdentityFreeTick,
  createIdentityFreeDecisionView
} = require('./identity/identityLock');
const { calculateWorldDemand } = require('./demand/demandModel');
const { buildAgentTypologySnapshot } = require('./agentTypology/typeTraceBuilder');

const actionRegistry = new Set(ACTION_REGISTRY);
const LIFE_STAGE_TICKS = Object.freeze({
  juvenile: 18 * 365,
  elder: 60 * 365,
  max: 90 * 365
});

function resolveLifeStage(ageTicks) {
  if (ageTicks < LIFE_STAGE_TICKS.juvenile) return 'juvenile';
  if (ageTicks >= LIFE_STAGE_TICKS.elder) return 'elder';
  return 'adult';
}

function createInitialLife(agent, worldObj) {
  const existing = agent.life || {};
  const ageTicks = Math.max(0, Math.floor(existing.ageTicks || 0));
  const maxAgeTicks = Math.max(1, Math.floor(existing.maxAgeTicks || LIFE_STAGE_TICKS.max));
  const alive = existing.alive !== false && ageTicks < maxAgeTicks;

  return {
    birthTick: Number.isFinite(existing.birthTick) ? existing.birthTick : (worldObj.tick || 0) - ageTicks,
    ageTicks,
    lifeStage: existing.lifeStage || resolveLifeStage(ageTicks),
    lifeCondition: existing.lifeCondition || (alive ? 'alive' : 'deceased'),
    alive,
    maxAgeTicks
  };
}

function runLifeKernel(agent, worldObj) {
  const previousLife = createInitialLife(agent, worldObj);
  const ageTicks = previousLife.ageTicks + 1;
  const lifeStage = resolveLifeStage(ageTicks);
  const alive = previousLife.alive && ageTicks < previousLife.maxAgeTicks;
  const lifeCondition = alive ? 'alive' : 'deceased';
  const nextLife = {
    ...previousLife,
    ageTicks,
    lifeStage,
    lifeCondition,
    alive
  };

  agent.life = nextLife;
  agent._pendingDeath = !alive;

  return {
    agentId: agent.id,
    ageTicks,
    lifeStage,
    lifeCondition,
    alive,
    pendingDeath: agent._pendingDeath
  };
}

function createCorpseResourceEntry(agent, worldObj) {
  return {
    type: 'corpse',
    from: agent.id,
    location: agent.location,
    tick: worldObj.tick || 0
  };
}

function finalizePendingDeaths(npcs, worldObj) {
  const removedAgents = [];

  for (let index = npcs.length - 1; index >= 0; index -= 1) {
    const agent = npcs[index];
    if (!agent._pendingDeath) continue;
    removedAgents.push(agent);
    npcs.splice(index, 1);
  }

  if (!removedAgents.length) return [];
  if (!worldObj.resourceEntries) worldObj.resourceEntries = [];
  const corpseEntries = removedAgents
    .reverse()
    .map(agent => createCorpseResourceEntry(agent, worldObj));
  worldObj.resourceEntries.push(...corpseEntries);
  return corpseEntries;
}

function perceive(npc, worldObj = world, allNpcs = []) {
  return {
    field: worldObj.getField(npc.location),
    nearbyEvents: worldObj.getRecentEvents(npc.location),
    nearbyAgents: allNpcs
      .filter(other => other.id !== npc.id && other.location === npc.location)
      .map(other => ({ id: other.id, type: other.type, location: other.location })),
    self: {
      id: npc.id,
      type: npc.type,
      location: npc.location,
      mana: npc.mana,
      needs: npc.needs
    }
  };
}

function queueFieldPerturbation(worldObj, tileId, perturbation) {
  if (!worldObj.fieldPerturbationQueue) {
    worldObj.fieldPerturbationQueue = [];
  }

  worldObj.fieldPerturbationQueue.push({
    tileId,
    perturbation: createFieldDelta(perturbation)
  });
}

function applyActionEffects(action, npc, worldObj) {
  if (action.profile && typeof npc.stamina === 'number') {
    npc.stamina = Math.max(0, Math.min(100, npc.stamina - action.profile.staminaCost));
  }

  if (action.effects && action.effects.manaChange) {
    const delta = action.effects.manaChange.current || 0;
    npc.mana.current = Math.max(0, Math.min(npc.mana.capacity, npc.mana.current + delta));
  }

  if (action.effects && action.effects.fieldChange) {
    queueFieldPerturbation(worldObj, npc.location, action.effects.fieldChange);
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

function queueWorldFeedback(npc, worldObj) {
  const leakage = Math.max(0, (npc.mana.current / (npc.mana.capacity || 1)) - 0.1);
  queueFieldPerturbation(worldObj, npc.location, { arcane: leakage * 0.01 });
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

function createRuntimeSnapshot(npc, needs, memories, influenceField, intents, selectedIntent, decisionTrace, needAfter, skillGain, knowledgeLearned, identityChanges, agentTypologySnapshot, intentTrace) {
  npc.runtime = {
    lastNeeds: needs.profile,
    lastNeedUrgency: needs.urgency,
    lastMemories: memories.slice(0, 5),
    lastInfluenceProfile: influenceField.profile,
    lastTopInfluences: influenceField.topInfluences.slice(0, 5),
    lastIntents: intents.map(intent => ({
      intent: intent.intent,
      score: intent.score,
      components: intent.components,
      reasonTrace: intent.reasonTrace
    })),
    lastSelectedIntent: selectedIntent ? selectedIntent.intent : null,
    lastDecisionTrace: decisionTrace,
    lastNeedAfter: needAfter,
    lastSkillGain: skillGain,
    lastKnowledgeLearned: knowledgeLearned,
    lastIdentityChanges: identityChanges,
    lastAgentTypologySnapshot: agentTypologySnapshot,
    lastIntentTrace: intentTrace
  };
}

function simulateAgent(npc, worldObj, allNpcs = []) {
  ensureMemory(npc);

  const decisionAgent = createIdentityFreeDecisionView(npc);
  const knowledgeLearned = learnKnowledgeFromMemories(npc);
  const memoryDecay = decayAgentMemory(npc);
  const perception = perceive(npc, worldObj, allNpcs);
  const memories = recallMemories(npc, { location: npc.location });
  const needs = evaluateNeeds(npc);
  const influenceField = createInfluenceField({
    field: perception.field,
    memories,
    needs: needs.profile
  });
  const rawActions = getAvailableActions(decisionAgent);
  const { registeredActions, rejectedProposals } = filterRegisteredActions(rawActions);
  const pipelineResult = intentPipeline.execute(decisionAgent, registeredActions, {
    perception,
    memories,
    needs,
    influenceProfile: influenceField.profile,
    demandIndex: worldObj.demandIndex || {}
  });
  const intents = pipelineResult.enrichedIntents;
  const selectedIntent = pipelineResult.finalIntent;
  const agentTypologySnapshot = buildAgentTypologySnapshot(npc, intents.map(intent => ({
    action: intent.intent,
    category: intent.category,
    modifier: intent.components?.typologyModifier ?? 1
  })));
  const decisionTrace = createDecisionTrace({
    agentId: npc.id,
    tick: worldObj.tick || 0,
    candidates: intents,
    influenceField,
    resolutionResult: selectedIntent
  });
  const selected = selectedIntent ? selectedIntent.action : null;
  const manaBefore = Object.assign({}, npc.mana);
  let actionRejected = !selected && rejectedProposals.length > 0;
  let rejectionReason = actionRejected ? `Action '${rejectedProposals[0]}' not registered` : null;
  const memoryUpdates = [];
  let skillGain = [];
  let identityChanges = { before: [], after: [], added: [], removed: [] };
  let communicationTrace = null;
  let actionYieldSnapshot = null;

  if (selected) {
    if (!actionRegistry.has(selected.id)) {
      actionRejected = true;
      rejectionReason = 'action-not-registered';
      console.warn(`Rejected execution of unregistered action '${selected.id}' for ${npc.id}`);
    } else {
      if (selected.id === 'share_information' || selected.id === 'communicate' || selected.id === 'teach') {
        const targetInfo = perception.nearbyAgents[0];
        const receiver = targetInfo ? allNpcs.find(agent => agent.id === targetInfo.id) : null;
        const teachMemory = selected.id === 'teach'
          ? [...(npc.memory.shortTerm || []), ...(npc.memory.longTerm || [])]
            .find(memory => String(memory.type || '').includes('knowledge'))
          : undefined;
        const transfer = prepareInformationTransfer(npc, receiver, {
          tick: worldObj.tick || 0,
          memory: teachMemory
        });

        if (transfer) {
          recordMemory(receiver, transfer.heardMemory);
          communicationTrace = {
            sourceId: transfer.sourceId,
            receiverId: transfer.receiverId,
            trust: transfer.trust,
            communicationQuality: transfer.communicationQuality,
            transferredStrength: transfer.heardMemory.strength,
            memoryType: transfer.heardMemory.type,
            target: transfer.heardMemory.target || null
          };
          memoryUpdates.push({
            type: 'heard_memory_created',
            receiverId: receiver.id,
            strength: transfer.heardMemory.strength
          });
        }
      } else {
        applyActionEffects(selected, npc, worldObj);
        updateManaAfterAction(npc, selected, perception.field);
        queueWorldFeedback(npc, worldObj);
      }

      actionYieldSnapshot = computeActionYield(selected, {
        world: worldObj,
        tileId: npc.location,
        field: perception.field,
        actionHistory: npc.memory?.recentEvents || []
      });

      recordActionOutcome(npc, selected.id, worldObj.tick || 0, 8);
      memoryUpdates.push({ type: 'success', action: selected.id, value: 8 });
      skillGain = applySkillGain(npc, selected.id);

      if (selected.id === 'study_arcane') {
        const learned = learnKnowledge(npc, {
          key: 'arcane:fundamental-patterns',
          topic: 'fundamental arcane patterns',
          action: 'study_arcane',
          actions: ['study_arcane', 'cast_magic'],
          tick: worldObj.tick || 0
        });
        if (learned) {
          knowledgeLearned.push(learned);
          recordMemory(npc, {
            type: 'knowledge',
            knowledgeKey: learned.key,
            target: learned.topic,
            action: learned.action,
            strength: 20,
            tick: worldObj.tick || 0
          });
        }
      }

    }
  }

  const manaAfter = Object.assign({}, npc.mana);
  const needAfter = advanceNeeds(npc);
  createRuntimeSnapshot(
    npc, needs, memories, influenceField, intents, selectedIntent, decisionTrace, needAfter,
    skillGain, knowledgeLearned, identityChanges, agentTypologySnapshot, pipelineResult.intentTrace
  );

  return {
    agentId: npc.id,
    agentType: npc.type,
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
    influenceProfile: influenceField.profile,
    influenceSources: influenceField.sources,
    demandSnapshot: worldObj.demandIndex || null,
    topInfluences: influenceField.topInfluences,
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
    decisionTrace,
    intentTrace: pipelineResult.intentTrace,
    actionYieldSnapshot,
    memoryUpdates,
    skillGain,
    knowledgeLearned,
    identityChanges,
    communicationTrace,
    agentTypologySnapshot,
    manaBefore,
    manaAfter,
    position: npc.location
  };
}

function commitFieldDynamics(worldObj) {
  const perturbations = worldObj.fieldPerturbationQueue || [];
  const config = worldObj.fieldDynamicsConfig || {};
  const gains = createStabilityGains(worldObj.stabilityGains).field;
  const dynamicsTrace = runFieldDynamicsTick(
    worldObj.areas,
    perturbations,
    {
      ...config,
      diffusionRate: (config.diffusionRate ?? 0.1) * gains.diffusionGain,
      conversionRate: (config.conversionRate ?? 0.01) * gains.conversionGain,
      regenRate: (config.regenRate ?? 0.01) * gains.equilibriumRestorationRate
    }
  );

  Object.entries(dynamicsTrace.finalFieldState).forEach(([tileId, field]) => {
    const area = worldObj.areas.get(tileId);
    if (area) area.field = createFieldState(field);
  });

  worldObj.fieldPerturbationQueue = [];
  worldObj.lastFieldDynamicsTrace = dynamicsTrace;
  return dynamicsTrace;
}

function tickManager(npcs, worldObj, traceCollector) {
  const log = [];
  const agentTraces = [];
  worldObj.tick = (worldObj.tick || 0) + 1;
  const lifeTraces = npcs.map(npc => runLifeKernel(npc, worldObj));
  const previousIdentities = new Map(npcs.map(npc => [npc.id, beginIdentityFreeTick(npc)]));

  if (traceCollector && typeof traceCollector.beginTick === 'function') {
    traceCollector.beginTick(worldObj.tick, worldObj);
  }

  const demand = calculateWorldDemand(worldObj, npcs, worldObj.demandIndex);
  worldObj.demandIndex = demand.index;
  if (!worldObj.demandHistory) worldObj.demandHistory = [];
  worldObj.demandHistory.push({ tick: worldObj.tick, ...demand.index });
  if (worldObj.demandHistory.length > 100) worldObj.demandHistory.shift();
  if (traceCollector && typeof traceCollector.recordDemand === 'function') {
    traceCollector.recordDemand(demand);
  }

  for (const npc of npcs) {
    const agentTrace = simulateAgent(npc, worldObj, npcs);
    agentTrace.lifeTrace = lifeTraces.find(lifeTrace => lifeTrace.agentId === npc.id) || null;
    agentTraces.push(agentTrace);

    if (traceCollector && typeof traceCollector.recordAgent === 'function') {
      traceCollector.recordAgent(agentTrace);
    }

    log.push({
      npc: agentTrace.agentId,
      action: agentTrace.actionSelected,
      score: agentTrace.scoreBreakdown ? agentTrace.scoreBreakdown.total : null
    });
  }

  if (worldObj.resourceMap) {
    if (!worldObj.resourceBaselineMap) {
      worldObj.resourceBaselineMap = worldObj.resourceMap;
    }
    const resourceFlow = runResourceFlowTick({
      resourceMap: worldObj.resourceMap,
      baselineMap: worldObj.resourceBaselineMap,
      actionYieldSnapshots: agentTraces.map(agentTrace => agentTrace.actionYieldSnapshot).filter(Boolean),
      world: worldObj,
      config: worldObj.resourceFlowConfig || {}
    });
    worldObj.resourceMap = resourceFlow.resourceMap;
    worldObj.lastResourceFlowTrace = resourceFlow.trace;
    if (traceCollector?.current) {
      traceCollector.current.resourceFlow = resourceFlow.trace;
      traceCollector.current.resourceGeography = resourceFlow.trace?.finalResourceState || traceCollector.current.resourceGeography;
    }
  }

  const fieldDynamicsTrace = commitFieldDynamics(worldObj);
  if (traceCollector?.current) {
    traceCollector.current.fieldDynamics = fieldDynamicsTrace;
  }

  const emergenceTrace = emergenceTickHook({
    agents: npcs,
    agentLog: agentTraces.map(agentTrace => ({
      agentId: agentTrace.agentId,
      action: agentTrace.actionSelected,
      tileId: agentTrace.position
    })),
    history: worldObj.emergenceHistory || {},
    config: {
      ...(worldObj.emergenceConfig || {}),
      gains: createStabilityGains(worldObj.stabilityGains)
    }
  });
  worldObj.emergenceHistory = emergenceTrace.history;
  emergenceTrace.perturbations.forEach(proposal => {
    queueFieldPerturbation(worldObj, proposal.tileId, proposal.fields);
  });
  worldObj.lastEmergenceTrace = emergenceTrace;

  if (traceCollector?.current) {
    traceCollector.current.coupledEmergence = emergenceTrace;
  }

  const stabilityTrace = runStabilityController({
    fieldDynamics: fieldDynamicsTrace,
    emergence: emergenceTrace,
    agents: npcs,
    agentLog: agentTraces.map(agentTrace => ({
      agentId: agentTrace.agentId,
      action: agentTrace.actionSelected,
      tileId: agentTrace.position
    })),
    currentGains: worldObj.stabilityGains
  });
  worldObj.stabilityGains = stabilityTrace.adjustedGains;
  worldObj.lastStabilityTrace = stabilityTrace;
  if (!worldObj.stabilityHistory) worldObj.stabilityHistory = [];
  worldObj.stabilityHistory.push({
    tick: worldObj.tick,
    metrics: stabilityTrace.metrics,
    adjustedGains: stabilityTrace.adjustedGains
  });
  if (worldObj.stabilityHistory.length > 50) worldObj.stabilityHistory.shift();

  if (traceCollector?.current) {
    traceCollector.current.stability = stabilityTrace;
  }

  npcs.forEach((npc, index) => {
    const identityChanges = applyPostTickIdentity(npc, previousIdentities.get(npc.id));
    const agentTrace = agentTraces[index];
    if (agentTrace) agentTrace.identityChanges = identityChanges;
    if (npc.runtime) npc.runtime.lastIdentityChanges = identityChanges;
  });

  const corpseEntries = finalizePendingDeaths(npcs, worldObj);
  if (traceCollector?.current) {
    traceCollector.current.life = {
      agents: lifeTraces,
      corpseEntries
    };
  }

  if (traceCollector && typeof traceCollector.endTick === 'function') {
    traceCollector.endTick();
  }

  return log;
}

module.exports = { tickManager, simulateAgent, queueFieldPerturbation };
