const { ACTION_PROFILES } = require('../actions/actionProfiles');
const { getKnowledgeLearningMultiplier } = require('./knowledgeSystem');
const { ensureSkills, getActionSkills } = require('./skillSystem');
const { getTraitGrowthMultiplier } = require('./traitSystem');

function getDiminishingReturn(skillValue) {
  return 1 / (1 + ((skillValue || 0) / 50));
}

function calculateSkillGain(agent, skill, actionId, baseGain = 0.5) {
  const current = ensureSkills(agent)[skill] || 0;
  return baseGain
    * getTraitGrowthMultiplier(agent.traits, skill)
    * getKnowledgeLearningMultiplier(agent, actionId)
    * getDiminishingReturn(current);
}

function getFieldManipulationSkills(actionId) {
  const affinity = ACTION_PROFILES[actionId]?.fieldAffinity || {};
  return Object.keys(affinity)
    .filter(field => affinity[field] !== 0)
    .map(field => `${field}Manipulation`)
    .filter(skill => skill !== 'arcaneManipulation' || actionId.includes('arcane') || actionId === 'cast_magic');
}

function applySkillGain(agent, actionId) {
  const skills = ensureSkills(agent);
  const relevant = [...new Set([
    ...getActionSkills(actionId),
    ...getFieldManipulationSkills(actionId)
  ])].filter(skill => Object.prototype.hasOwnProperty.call(skills, skill));

  return relevant.map(skill => {
    const before = skills[skill];
    const gain = calculateSkillGain(agent, skill, actionId);
    skills[skill] += gain;
    return { skill, before, gain, after: skills[skill], action: actionId };
  });
}

module.exports = {
  applySkillGain,
  calculateSkillGain,
  getDiminishingReturn
};
