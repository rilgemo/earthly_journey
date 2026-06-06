const WORLD_FIELD_INFLUENCE_PROFILES = Object.freeze({
  fire: Object.freeze({ forge: 1, fire_magic: 1 }),
  water: Object.freeze({ gather_herbs: 1, alchemy: 1 }),
  arcane: Object.freeze({ cast_magic: 1, meditate: 0.75 })
});

const MEMORY_INFLUENCE_PROFILES = Object.freeze({
  danger: Object.freeze({ safety: 1 }),
  resource: Object.freeze({ forage: 1 }),
  magic: Object.freeze({ cast_magic: 1 }),
  success: Object.freeze({ repeat_success: 0.5 })
});

const NEED_INFLUENCE_PROFILES = Object.freeze({
  hunger: Object.freeze({ forage: 0.15 }),
  fatigue: Object.freeze({ rest: 0.15 }),
  manaNeed: Object.freeze({ meditate: 0.12 }),
  socialNeed: Object.freeze({ social: 0.12 }),
  safetyNeed: Object.freeze({ safety: 0.15 })
});

const ROLE_INFLUENCE_PROFILES = Object.freeze({
  blacksmith: Object.freeze({ forge: 12 }),
  apothecary: Object.freeze({ alchemy: 12, brew: 12 }),
  mage: Object.freeze({ cast_magic: 12, meditate: 6 }),
  farmer: Object.freeze({ forage: 8 }),
  wolf: Object.freeze({ forage: 4, safety: 4 })
});

const ACTION_INFLUENCE_PROFILES = Object.freeze({
  forage: Object.freeze(['forage', 'gather_herbs', 'resource']),
  rest_camp: Object.freeze(['rest', 'safety', 'meditate']),
  cast_spark: Object.freeze(['cast_magic', 'fire_magic', 'magic']),
  travel: Object.freeze(['exploration', 'safety']),
  share_information: Object.freeze(['social'])
});

module.exports = {
  WORLD_FIELD_INFLUENCE_PROFILES,
  MEMORY_INFLUENCE_PROFILES,
  NEED_INFLUENCE_PROFILES,
  ROLE_INFLUENCE_PROFILES,
  ACTION_INFLUENCE_PROFILES
};
