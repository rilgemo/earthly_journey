const { calculateTypeInfluence } = require('./typeInfluenceModel');

function applyTypologyToScore(score, typeInfluence) {
  return score * (typeInfluence?.finalModifier ?? 1);
}

function createInteractionModifier(profile, action, context) {
  const influence = calculateTypeInfluence(profile, action, context);
  return Object.freeze({
    typeId: influence.typeId,
    modifier: influence.finalModifier,
    influence,
    apply(score) {
      return applyTypologyToScore(score, influence);
    }
  });
}

module.exports = {
  applyTypologyToScore,
  createInteractionModifier
};
