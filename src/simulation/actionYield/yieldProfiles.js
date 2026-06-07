const YIELD_PROFILES = Object.freeze({
  forage: profile('forage', { food: 4 }, { foodPotential: 1, life: 0.4 }),
  hunt: profile('hunt', { food: 5, material: 2 }, { foodPotential: 0.7, materialPotential: 0.4, life: 0.3 }),
  farm: profile('farm', { food: 6 }, { foodPotential: 0.7, waterPotential: 0.5, water: 0.4, life: 0.5 }),
  mine: profile('mine', { material: 6 }, { materialPotential: 1, earth: 0.5, fire: 0.1 }),
  gather_water: profile('gather_water', { water: 5 }, { waterPotential: 1, water: 0.6 }),
  study_arcane: profile('study_arcane', { arcane: 3 }, { arcanePotential: 1, arcane: 0.7 })
});

function profile(actionId, baseYield, affinities) {
  return Object.freeze({
    actionId,
    baseYield: Object.freeze(baseYield),
    affinities: Object.freeze(affinities)
  });
}

function getYieldProfile(actionId) {
  return YIELD_PROFILES[actionId] || profile(actionId, {}, {});
}

module.exports = {
  YIELD_PROFILES,
  getYieldProfile
};
