const WORLD_FIELD_INFLUENCE_PROFILES = Object.freeze({
  fire: Object.freeze({ forge: 1, fire_magic: 1, attack: 0.5 }),
  water: Object.freeze({ gather_water: 1, farm: 0.75, alchemy: 1 }),
  air: Object.freeze({ move: 0.75, flee: 0.5 }),
  earth: Object.freeze({ mine: 1, forge: 0.5, defend: 0.5 }),
  life: Object.freeze({ farm: 1, forage: 0.75, hunt: 0.5 }),
  arcane: Object.freeze({ cast_magic: 1, channel_arcane: 1, study_arcane: 0.8, meditate: 0.75 })
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
  blacksmith: Object.freeze({ forge: 12, mine: 8, craft_item: 8 }),
  apothecary: Object.freeze({ alchemy: 12, brew: 12 }),
  mage: Object.freeze({ cast_magic: 12, study_arcane: 8, meditate: 6 }),
  farmer: Object.freeze({ farm: 12, forage: 8, gather_water: 6 }),
  hunter: Object.freeze({ hunt: 12, forage: 6, attack: 5, move: 4 }),
  animal: Object.freeze({ forage: 4, move: 4, safety: 4 }),
  monster: Object.freeze({ hunt: 8, attack: 8, safety: 4 })
});

const ACTION_INFLUENCE_PROFILES = Object.freeze({
  forage: Object.freeze(['forage', 'gather_herbs', 'resource']),
  rest: Object.freeze(['rest', 'safety']),
  move: Object.freeze(['exploration', 'safety', 'move']),
  farm: Object.freeze(['farm', 'forage', 'water_stability']),
  gather_water: Object.freeze(['gather_water', 'water_stability']),
  hunt: Object.freeze(['hunt', 'forage']),
  chop_wood: Object.freeze(['chop_wood', 'resource']),
  mine: Object.freeze(['mine', 'earth']),
  forge: Object.freeze(['forge', 'fire_magic']),
  craft_item: Object.freeze(['craft_item']),
  cast_magic: Object.freeze(['cast_magic', 'fire_magic', 'magic']),
  channel_arcane: Object.freeze(['cast_magic', 'magic']),
  study_arcane: Object.freeze(['cast_magic', 'meditate', 'magic']),
  meditate: Object.freeze(['meditate', 'rest', 'magic']),
  communicate: Object.freeze(['social']),
  share_information: Object.freeze(['social']),
  trade: Object.freeze(['social']),
  teach: Object.freeze(['social', 'magic']),
  attack: Object.freeze(['attack', 'fire_magic']),
  defend: Object.freeze(['safety']),
  flee: Object.freeze(['safety', 'move'])
});

module.exports = {
  WORLD_FIELD_INFLUENCE_PROFILES,
  MEMORY_INFLUENCE_PROFILES,
  NEED_INFLUENCE_PROFILES,
  ROLE_INFLUENCE_PROFILES,
  ACTION_INFLUENCE_PROFILES
};
