const { getActionInfluence } = require('../influenceField');
const { getActionSkills } = require('../skills/skillSystem');
const { TRAIT_SKILL_AFFINITY } = require('../skills/traitSystem');
const { getDemandOpportunityScore } = require('../demand/demandModel');
const { resolveTypologyWeights } = require('../agentTypology/typologyResolver');

// Actions grouped by exertion category for feasibility masking.
// needScore remains additive and separate — it represents agent urgency,
// not capability. The mask represents physical/mental feasibility.
const MASK_HEAVY_WORK  = new Set(['forge', 'mine', 'hunt', 'farm', 'chop_wood', 'attack']);
const MASK_LIGHT_WORK  = new Set(['gather_water', 'craft_item', 'defend', 'flee', 'forage', 'move', 'trade']);
const MASK_REST_LIKE   = new Set(['rest', 'meditate']);
const MASK_MAGIC_LIKE  = new Set(['cast_magic', 'channel_arcane', 'study_arcane']);
// social-like and uncategorised default to 1.0

const FATIGUE_THRESHOLD = 60;
const HUNGER_THRESHOLD  = 60;

// Penalties use max(), not multiplication, so two simultaneous bad needs
// do not compound below a reasonable floor for skill-dominant agents.
function computeFeasibilityMask(action, needProfile) {
  const fatigue = needProfile.fatigue || 0;
  const hunger  = needProfile.hunger  || 0;
  let reduction = 0;

  if (fatigue >= FATIGUE_THRESHOLD) {
    if (MASK_HEAVY_WORK.has(action.id))       reduction = Math.max(reduction, 0.4);
    else if (MASK_LIGHT_WORK.has(action.id))  reduction = Math.max(reduction, 0.3);
    else if (MASK_MAGIC_LIKE.has(action.id))  reduction = Math.max(reduction, 0.2);
    else if (!MASK_REST_LIKE.has(action.id))  reduction = Math.max(reduction, 0.15);
    // rest-like: no reduction (mask stays 1.0)
  }

  if (hunger >= HUNGER_THRESHOLD) {
    if (MASK_HEAVY_WORK.has(action.id))       reduction = Math.max(reduction, 0.3);
    else if (MASK_LIGHT_WORK.has(action.id))  reduction = Math.max(reduction, 0.15);
    // rest / magic / social: unaffected by hunger
  }

  return 1.0 - reduction;
}

function stableHash(value) {
  const input = JSON.stringify(value, Object.keys(value || {}).sort());
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }
  return `seed:${Math.abs(hash)}`;
}

function evaluateFieldMatch(agent, field) {
  return ['fire', 'water', 'earth', 'arcane'].reduce((sum, key) => {
    return sum + ((agent.affinities?.[key] || 0) * (field?.[key] || 0));
  }, 0);
}

function evaluateManaResonance(agent, field) {
  let dominant = 'arcane';
  let max = -Infinity;

  for (const key of ['fire', 'water', 'earth', 'arcane']) {
    if ((field?.[key] || 0) > max) {
      max = field[key] || 0;
      dominant = key;
    }
  }

  return (agent.mana?.stability || 0) * ((agent.mana?.affinity?.[dominant]) || 0);
}

function getNeedComponent(action, needProfile = {}) {
  if (action.type === 'social') {
    return (needProfile.socialNeed || 0) * 0.04;
  }

  if (action.id === 'rest' || action.id === 'meditate') {
    return ((needProfile.fatigue || 0) * 0.04) + ((needProfile.manaNeed || 0) * 0.03);
  }

  if (action.type === 'magic') {
    return ((needProfile.manaNeed || 0) * 0.015) + ((needProfile.socialNeed || 0) * 0.01);
  }

  if (action.id === 'move' || action.id === 'flee') {
    return ((needProfile.socialNeed || 0) * 0.02) + ((needProfile.safetyNeed || 0) * 0.01);
  }

  return ((needProfile.hunger || 0) * 0.025) + ((needProfile.socialNeed || 0) * 0.005);
}

function getMemoryComponent(action, memories = [], bias = {}) {
  const directBias = bias[action.id] || 0;
  const memoryBias = memories.reduce((sum, memory) => {
    if (memory.action === action.id) return sum + ((memory.strength || 0) * 0.02);
    if (memory.type === 'danger' && (action.id === 'move' || action.id === 'flee')) {
      return sum - ((memory.strength || 0) * 0.01);
    }
    return sum;
  }, 0);

  return directBias + memoryBias;
}

function getPureSkillAffinity(agent, actionId) {
  const relevant = getActionSkills(actionId);
  if (!relevant.length) return 0;
  const skills = agent.skills || {};
  return relevant.reduce((sum, skill) => sum + (skills[skill] || 0), 0) / relevant.length;
}

function getPureKnowledgeForAction(agent, actionId) {
  const knowledge = Array.isArray(agent.knowledge) ? agent.knowledge : [];
  return knowledge.filter(entry => entry.action === actionId || entry.actions?.includes(actionId));
}

function scoreIntent(agent, action, context = {}) {
  const field = context.perception?.field || {};
  const fieldScore = evaluateFieldMatch(agent, field);
  const manaScore = evaluateManaResonance(agent, field);
  const needScore = getNeedComponent(action, context.needs?.profile || {});
  const memoryScore = getMemoryComponent(action, context.memories || [], agent.memory?.bias || {});
  const communicationScore = action.type === 'social'
    ? (((context.memories || []).length > 0 && context.perception?.nearbyAgents?.length > 0) ? 1 : -100)
    : 0;
  const skillScore = getPureSkillAffinity(agent, action.id) * 0.3;
  const traitKeys = [...new Set(getActionSkills(action.id).flatMap(skill => TRAIT_SKILL_AFFINITY[skill] || []))];
  const traitScore = traitKeys.length
    ? traitKeys.reduce((sum, trait) => sum + (agent.traits?.[trait] || 0), 0) / traitKeys.length * 0.02
    : 0;
  const knowledgeScore = getPureKnowledgeForAction(agent, action.id).length;
  const environmentScore = action.type === 'magic' ? manaScore : fieldScore;
  const influenceScore = getActionInfluence(action.id, context.influenceProfile || {});
  const demandScore = getDemandOpportunityScore(action.id, context.demandIndex || {});
  const mask = computeFeasibilityMask(action, context.needs?.profile || {});
  const maskedComponents = (skillScore + memoryScore + influenceScore + demandScore
    + traitScore + knowledgeScore + environmentScore + communicationScore) * mask;
  // needScore stays additive and unmasked — it is agent urgency, not feasibility.
  const preTypologyTotal = action.baseUtility + needScore + maskedComponents;
  const typology = resolveTypologyWeights(agent, action, context);
  const typologyScore = preTypologyTotal * (typology.scoreModifier - 1);
  const score = preTypologyTotal + typologyScore;

  return Object.freeze({
    intent: action.id,
    category: action.type,
    score,
    components: Object.freeze({
      base: action.baseUtility,
      needScore,
      memoryScore,
      skillScore,
      traitScore,
      knowledgeScore,
      communicationScore,
      influenceScore,
      demandScore,
      fieldScore,
      manaScore,
      environmentScore,
      typologyScore,
      typologyModifier: typology.scoreModifier,
      typologyType: typology.typeId
    })
  });
}

function scoreIntents(agent, actions = [], context = {}) {
  const intentScores = actions.map(action => scoreIntent(agent, action, context));
  const scoreBreakdown = Object.freeze(Object.fromEntries(
    intentScores.map(intent => [intent.intent, intent.components])
  ));

  return Object.freeze({
    intentScores: Object.freeze(intentScores),
    scoreBreakdown,
    deterministicSeedHash: stableHash({
      agentId: agent.id,
      actionIds: actions.map(action => action.id),
      location: agent.location,
      field: context.perception?.field || {},
      needs: context.needs?.profile || {},
      memoryCount: (context.memories || []).length
    })
  });
}

module.exports = {
  scoreIntents,
  scoreIntent,
  evaluateFieldMatch,
  evaluateManaResonance,
  getNeedComponent,
  getMemoryComponent,
  getPureSkillAffinity,
  getPureKnowledgeForAction,
  computeFeasibilityMask
};
