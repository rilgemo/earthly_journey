const { getAgentTypeProfile } = require('./agentTypeRegistry');
const { mapAgentToTypeId } = require('./archetypeMapping');
const { calculateTypeInfluence } = require('./typeInfluenceModel');

function resolveAgentTypology(agent = {}) {
  return getAgentTypeProfile(mapAgentToTypeId(agent));
}

function resolveTypologyWeights(agent, action, context = {}) {
  const profile = resolveAgentTypology(agent);
  const influence = calculateTypeInfluence(profile, action, context);

  return Object.freeze({
    profile,
    typeId: profile.typeId,
    influence,
    scoreModifier: influence.finalModifier
  });
}

module.exports = {
  resolveAgentTypology,
  resolveTypologyWeights
};
