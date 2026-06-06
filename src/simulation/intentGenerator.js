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
  if (action.type === 'rest') {
    return (needProfile.fatigue * 0.04) + (needProfile.manaNeed * 0.03);
  }

  if (action.type === 'magic') {
    return (needProfile.manaNeed * 0.015) + (needProfile.socialNeed * 0.01);
  }

  if (action.type === 'travel') {
    return (needProfile.socialNeed * 0.02) + (needProfile.safetyNeed * 0.01);
  }

  return (needProfile.hunger * 0.025) + (needProfile.socialNeed * 0.005);
}

function getMemoryComponent(action, memories, bias = {}) {
  const directBias = bias[action.id] || 0;
  const memoryBias = memories.reduce((sum, memory) => {
    if (memory.action === action.id) return sum + ((memory.strength || 0) * 0.02);
    if (memory.type === 'danger' && action.type === 'travel') return sum - ((memory.strength || 0) * 0.01);
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
    const roleScore = agent.role === 'mage' && action.type === 'magic' ? 0.5 : 0;
    const environmentScore = action.type === 'magic' ? manaScore : fieldScore;
    const total = action.baseUtility + needScore + memoryScore + roleScore + environmentScore;

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
        fieldScore,
        manaScore,
        environmentScore
      },
      reasonTrace: [
        `base:${action.baseUtility.toFixed(2)}`,
        `need:${needScore.toFixed(2)}`,
        `memory:${memoryScore.toFixed(2)}`,
        `role:${roleScore.toFixed(2)}`,
        `environment:${environmentScore.toFixed(2)}`
      ]
    };
  });
}

function resolveIntent(intents) {
  if (!intents.length) return null;

  return intents.reduce((best, intent) => {
    if (!best) return intent;
    return intent.score > best.score ? intent : best;
  }, null);
}

module.exports = {
  generateIntents,
  resolveIntent,
  evaluateFieldMatch,
  evaluateManaResonance
};
