const ACTION_PROFILES = Object.freeze({
  forage: profile('forage', 'survival', { life: 0.02, earth: 0.01 }, 0, 0.2, 2, 0, 'resource'),
  rest: profile('rest', 'survival', {}, 0, 0, -8, 0, 'recovery'),
  move: profile('move', 'survival', { air: 0.02 }, 0, 0.1, 2, 0, 'exploration'),
  farm: profile('farm', 'economic', { life: 0.12, water: 0.06 }, 0.1, 0.1, 5, 0, 'growth'),
  gather_water: profile('gather_water', 'economic', { water: 0.08 }, 0, 0.1, 3, 0, 'water_stability'),
  hunt: profile('hunt', 'economic', { life: -0.08, earth: 0.04 }, 0, 0.5, 7, 0, 'food'),
  chop_wood: profile('chop_wood', 'economic', { life: -0.04, earth: 0.02 }, 0, 0.3, 6, 0, 'materials'),
  mine: profile('mine', 'economic', { earth: -0.08, fire: 0.01 }, 0, 0.4, 8, 0, 'ore'),
  forge: profile('forge', 'craft', { fire: 0.12, earth: -0.06 }, 0, 0.3, 8, 0, 'crafted_goods'),
  craft_item: profile('craft_item', 'craft', { earth: -0.02, life: 0.01 }, 0, 0.2, 5, 0, 'crafted_goods'),
  cast_magic: profile('cast_magic', 'magic', {
    fire: 0.01, water: 0.01, air: 0.01, earth: 0.01, life: 0.01, arcane: 0.12
  }, 0, 0.6, 3, 8, 'arcane_instability'),
  channel_arcane: profile('channel_arcane', 'magic', { arcane: 0.08 }, 0, 0.5, 2, 5, 'arcane_charge'),
  study_arcane: profile('study_arcane', 'magic', { arcane: 0.02 }, 0, 0.1, 2, 2, 'arcane_stability_memory_generation'),
  meditate: profile('meditate', 'magic', { arcane: -0.02 }, 0, 0, -4, -5, 'arcane_stability'),
  communicate: profile('communicate', 'social', {}, 1, 0, 1, 0, 'social_memory'),
  share_information: profile('share_information', 'social', {}, 1.2, 0, 1, 0, 'knowledge_transfer'),
  trade: profile('trade', 'social', {}, 0.8, 0.1, 2, 0, 'exchange'),
  teach: profile('teach', 'social', {}, 1, 0.1, 3, 0, 'memory_generation'),
  attack: profile('attack', 'combat', { fire: 0.1, air: 0.06, life: -0.04 }, 0, 0.9, 10, 0, 'pressure'),
  defend: profile('defend', 'combat', { earth: 0.04 }, 0, 0.3, 5, 0, 'safety'),
  flee: profile('flee', 'combat', { air: 0.08 }, 0, 0.4, 8, 0, 'safety')
});

const PROFESSION_ACTIONS = Object.freeze({
  farmer: Object.freeze(['farm', 'forage', 'gather_water']),
  hunter: Object.freeze(['hunt', 'forage', 'move', 'attack']),
  blacksmith: Object.freeze(['forge', 'mine', 'craft_item']),
  mage: Object.freeze(['cast_magic', 'study_arcane', 'meditate']),
  animal: Object.freeze(['forage', 'move', 'flee']),
  monster: Object.freeze(['hunt', 'move', 'attack', 'defend'])
});

const UNIVERSAL_ACTIONS = Object.freeze(['rest', 'move', 'communicate', 'share_information']);

function profile(actionId, category, fieldAffinity, socialWeight, riskLevel, staminaCost, manaCost, expectedOutcomeBias) {
  return Object.freeze({
    actionId,
    category,
    fieldAffinity: Object.freeze(fieldAffinity),
    socialWeight,
    riskLevel,
    staminaCost,
    manaCost,
    expectedOutcomeBias
  });
}

function getProfessionActions(role) {
  return PROFESSION_ACTIONS[role] || ['forage', 'rest', 'move', 'communicate'];
}

function getProfessionBias(role, actionId) {
  return getProfessionActions(role).includes(actionId) ? 6 : 0;
}

module.exports = {
  ACTION_PROFILES,
  PROFESSION_ACTIONS,
  UNIVERSAL_ACTIONS,
  getProfessionActions,
  getProfessionBias
};
