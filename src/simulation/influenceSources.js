const {
  WORLD_FIELD_INFLUENCE_PROFILES,
  MEMORY_INFLUENCE_PROFILES,
  NEED_INFLUENCE_PROFILES
} = require('./influenceProfiles');
const { isHeardMemory } = require('./socialMemory');

function scaleProfile(profile = {}, scale = 1) {
  return Object.entries(profile).reduce((result, [key, weight]) => {
    result[key] = weight * scale;
    return result;
  }, {});
}

function mergeInfluence(target, contribution) {
  Object.entries(contribution || {}).forEach(([key, value]) => {
    target[key] = (target[key] || 0) + value;
  });
  return target;
}

function getWorldFieldInfluence(field = {}) {
  return Object.entries(WORLD_FIELD_INFLUENCE_PROFILES).reduce((result, [fieldKey, profile]) => {
    return mergeInfluence(result, scaleProfile(profile, Math.max(0, field[fieldKey] || 0)));
  }, {});
}

function getObservedMemoryInfluence(memories = []) {
  return memories.reduce((result, memory) => {
    if (isHeardMemory(memory)) return result;
    const profile = MEMORY_INFLUENCE_PROFILES[memory.type];
    return mergeInfluence(result, scaleProfile(profile, Math.max(0, memory.strength || 0)));
  }, {});
}

function getSocialInfluence(memories = []) {
  return memories.reduce((result, memory) => {
    if (!isHeardMemory(memory)) return result;
    const baseType = String(memory.type || '').replace(/^heard_/, '');
    const profile = MEMORY_INFLUENCE_PROFILES[baseType];
    return mergeInfluence(result, scaleProfile(profile, Math.max(0, memory.strength || 0) * 0.5));
  }, {});
}

function getNeedInfluence(needProfile = {}) {
  return Object.entries(NEED_INFLUENCE_PROFILES).reduce((result, [needKey, profile]) => {
    return mergeInfluence(result, scaleProfile(profile, Math.max(0, needProfile[needKey] || 0)));
  }, {});
}

module.exports = {
  mergeInfluence,
  getWorldFieldInfluence,
  getObservedMemoryInfluence,
  getSocialInfluence,
  getNeedInfluence
};
