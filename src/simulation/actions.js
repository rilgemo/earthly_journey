const { ACTION_PROFILES } = require('./actions/actionProfiles');

const ACTIONS = Object.freeze(
  Object.values(ACTION_PROFILES).map(profile => Object.freeze({
    id: profile.actionId,
    type: profile.category,
    baseUtility: 1,
    requirements: profile.manaCost > 0 ? { manaMin: profile.manaCost } : {},
    effects: {
      manaChange: profile.manaCost ? { current: -profile.manaCost } : {},
      fieldChange: profile.fieldAffinity
    },
    profile
  }))
);

const ACTIONS_BY_ID = new Map(ACTIONS.map(action => [action.id, action]));

function getAvailableActions(agent) {
  return ACTIONS.filter(action => {
    if (action.profile.manaCost > 0 && agent.mana.current < action.profile.manaCost) return false;
    return true;
  });
}

module.exports = {
  ACTIONS,
  ACTIONS_BY_ID,
  getAvailableActions
};
