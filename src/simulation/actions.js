const ACTIONS = [
  {
    id: 'forage',
    type: 'work',
    baseUtility: 1.0,
    requirements: { },
    effects: { manaChange: {}, fieldChange: { earth: +0.01 } }
  },
  {
    id: 'rest_camp',
    type: 'rest',
    baseUtility: 0.5,
    requirements: {},
    effects: { manaChange: { current: +10 }, fieldChange: {} }
  },
  {
    id: 'cast_spark',
    type: 'magic',
    baseUtility: 2.0,
    requirements: { manaMin: 5, fieldAffinity: { arcane: 0.1 } },
    effects: { manaChange: { current: -5 }, fieldChange: { arcane: +0.05 } }
  },
  {
    id: 'travel',
    type: 'travel',
    baseUtility: 0.8,
    requirements: {},
    effects: { }
  },
  {
    id: 'share_information',
    type: 'communication',
    baseUtility: 0.2,
    requirements: { nearbyAgent: true, memory: true },
    effects: {}
  }
];

function getAvailableActions(npc) {
  // minimal filter: if mana too low, remove magic
  return ACTIONS.filter(a => {
    if (a.type === 'magic' && npc.mana.current < (a.requirements.manaMin || 0)) return false;
    return true;
  });
}

module.exports = { ACTIONS, getAvailableActions };
