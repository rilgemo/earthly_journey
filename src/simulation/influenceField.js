const { ACTION_INFLUENCE_PROFILES } = require('./influenceProfiles');
const {
  mergeInfluence,
  getWorldFieldInfluence,
  getObservedMemoryInfluence,
  getSocialInfluence,
} = require('./influenceSources');

// needs is intentionally NOT a parameter here — physiological state belongs
// in needScore (intentScorer) and the feasibility mask, not in world-signal channels.
function createInfluenceField({ field = {}, memories = [] } = {}) {
  const sources = {
    world: getWorldFieldInfluence(field),
    memory: getObservedMemoryInfluence(memories),
    social: getSocialInfluence(memories),
  };

  const profile = Object.values(sources).reduce((result, source) => {
    return mergeInfluence(result, source);
  }, {});

  const topInfluences = Object.entries(profile)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => b.score - a.score);

  return { profile, sources, topInfluences };
}

function getActionInfluence(actionId, influenceProfile = {}) {
  const channels = ACTION_INFLUENCE_PROFILES[actionId] || [];
  return channels.reduce((sum, channel) => sum + (influenceProfile[channel] || 0), 0);
}

module.exports = {
  createInfluenceField,
  getActionInfluence
};
