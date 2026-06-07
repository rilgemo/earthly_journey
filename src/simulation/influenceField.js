const { ACTION_INFLUENCE_PROFILES } = require('./influenceProfiles');
const {
  mergeInfluence,
  getWorldFieldInfluence,
  getObservedMemoryInfluence,
  getSocialInfluence,
  getNeedInfluence
} = require('./influenceSources');

function createInfluenceField({ field = {}, memories = [], needs = {} } = {}) {
  const sources = {
    world: getWorldFieldInfluence(field),
    memory: getObservedMemoryInfluence(memories),
    social: getSocialInfluence(memories),
    needs: getNeedInfluence(needs)
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
