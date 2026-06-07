const TRAIT_KEYS = Object.freeze([
  'strength',
  'agility',
  'intelligence',
  'willpower',
  'manaSensitivity',
  'fireAffinity',
  'waterAffinity',
  'earthAffinity',
  'airAffinity',
  'lifeAffinity',
  'arcaneAffinity'
]);

const TRAIT_SKILL_AFFINITY = Object.freeze({
  farming: ['lifeAffinity', 'willpower'],
  hunting: ['agility', 'strength'],
  tracking: ['agility', 'intelligence'],
  mining: ['strength', 'earthAffinity'],
  forging: ['strength', 'fireAffinity'],
  crafting: ['intelligence', 'agility'],
  communication: ['intelligence', 'willpower'],
  teaching: ['intelligence', 'willpower'],
  arcaneTheory: ['intelligence', 'arcaneAffinity'],
  arcaneManipulation: ['manaSensitivity', 'willpower', 'arcaneAffinity'],
  fireManipulation: ['manaSensitivity', 'fireAffinity'],
  waterManipulation: ['manaSensitivity', 'waterAffinity'],
  earthManipulation: ['manaSensitivity', 'earthAffinity'],
  airManipulation: ['manaSensitivity', 'airAffinity'],
  lifeManipulation: ['manaSensitivity', 'lifeAffinity']
});

function createTraits(rng = Math.random, overrides = {}) {
  return Object.fromEntries(TRAIT_KEYS.map(key => [
    key,
    overrides[key] ?? (20 + (rng() * 60))
  ]));
}

function getTraitGrowthMultiplier(traits = {}, skill) {
  const keys = TRAIT_SKILL_AFFINITY[skill] || [];
  if (!keys.length) return 1;
  const average = keys.reduce((sum, key) => sum + (traits[key] || 0), 0) / keys.length;
  return 0.75 + (average / 100);
}

module.exports = {
  TRAIT_KEYS,
  TRAIT_SKILL_AFFINITY,
  createTraits,
  getTraitGrowthMultiplier
};
