const { createFieldDelta } = require('../elementalField/fieldState');
const { ACTION_PROFILES } = require('../actions/actionProfiles');

const ACTIVITY_PROFILES = Object.freeze({
  forging: Object.freeze({ fire: 0.12, earth: 0.08 }),
  farming: Object.freeze({ life: 0.1, water: 0.05 }),
  combat: Object.freeze({ fire: 0.15, air: 0.1 }),
  movement: Object.freeze({ air: 0.08 }),
  magic: Object.freeze({ arcane: 0.12 })
});

function classifyActivity(action = '') {
  const value = String(action).toLowerCase();
  const category = ACTION_PROFILES[value]?.category;

  if (value.includes('forge')) return 'forging';
  if (value.includes('farm') || value === 'forage') return 'farming';
  if (value.includes('combat') || value.includes('attack') || value.includes('fight')) return 'combat';
  if (value.includes('move')) return 'movement';
  if (value.includes('magic') || value.includes('cast') || value.includes('spell')) return 'magic';
  if (category === 'combat') return 'combat';
  if (category === 'magic') return 'magic';
  if (category === 'economic' || category === 'craft') return category;
  return null;
}

function coupleActivityToFields(agentLog = []) {
  const byTile = {};

  agentLog.forEach(entry => {
    const activity = classifyActivity(entry.action || entry.actionSelected);
    if (!activity || !entry.tileId) return;
    if (!byTile[entry.tileId]) {
      byTile[entry.tileId] = {
        fields: createFieldDelta(),
        activities: [],
        actions: []
      };
    }

    const action = entry.action || entry.actionSelected;
    const fieldSignature = ACTION_PROFILES[action]?.fieldAffinity || ACTIVITY_PROFILES[activity];
    Object.entries(fieldSignature).forEach(([field, value]) => {
      byTile[entry.tileId].fields[field] += value;
    });
    byTile[entry.tileId].activities.push(activity);
    byTile[entry.tileId].actions.push(action);
  });

  return Object.keys(byTile).sort().map(tileId => {
    const aggregate = byTile[tileId];
    return {
      tileId,
      fields: aggregate.fields,
      source: 'activity',
      activities: aggregate.activities,
      actions: aggregate.actions
    };
  });
}

module.exports = {
  ACTIVITY_PROFILES,
  classifyActivity,
  coupleActivityToFields
};
