const { getActionInfluence } = require('./influenceField');
const { getProfessionBias } = require('./actions/actionProfiles');

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

function getNeedComponent(action, needProfile) {
  if (action.type === 'social') {
    return needProfile.socialNeed * 0.04;
  }

  if (action.id === 'rest' || action.id === 'meditate') {
    return (needProfile.fatigue * 0.04) + (needProfile.manaNeed * 0.03);
  }

  if (action.type === 'magic') {
    return (needProfile.manaNeed * 0.015) + (needProfile.socialNeed * 0.01);
  }

  if (action.id === 'move' || action.id === 'flee') {
    return (needProfile.socialNeed * 0.02) + (needProfile.safetyNeed * 0.01);
  }

  return (needProfile.hunger * 0.025) + (needProfile.socialNeed * 0.005);
}

function getMemoryComponent(action, memories, bias = {}) {
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

function generateIntents(agent, actions, context) {
  const fieldScore = evaluateFieldMatch(agent, context.perception.field);
  const manaScore = evaluateManaResonance(agent, context.perception.field);

  return actions.map(action => {
    const needScore = getNeedComponent(action, context.needs.profile);
    const memoryScore = getMemoryComponent(action, context.memories, agent.memory?.bias || {});
    const communicationScore = action.type === 'social'
      ? ((context.memories.length > 0 && context.perception.nearbyAgents?.length > 0) ? 1 : -100)
      : 0;
    const roleScore = getProfessionBias(agent.role, action.id);
    const environmentScore = action.type === 'magic' ? manaScore : fieldScore;
    const influenceScore = getActionInfluence(action.id, context.influenceProfile || {});
    const total = action.baseUtility + needScore + memoryScore + roleScore + environmentScore + communicationScore + influenceScore;

    return {
      intent: action.id,
      action,
      category: action.type,
      score: total,
      components: {
        base: action.baseUtility,
        needScore,
        memoryScore,
        roleScore,
        communicationScore,
        influenceScore,
        fieldScore,
        manaScore,
        environmentScore
      },
      reasonTrace: [
        `base:${action.baseUtility.toFixed(2)}`,
        `need:${needScore.toFixed(2)}`,
        `memory:${memoryScore.toFixed(2)}`,
        `profession:${roleScore.toFixed(2)}`,
        `environment:${environmentScore.toFixed(2)}`,
        `influence:${influenceScore.toFixed(2)}`
      ]
    };
  });
}

module.exports = {
  generateIntents,
  evaluateFieldMatch,
  evaluateManaResonance
};
