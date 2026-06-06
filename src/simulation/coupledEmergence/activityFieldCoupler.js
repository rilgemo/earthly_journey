const { createFieldDelta } = require('../elementalField/fieldState');

const ACTIVITY_PROFILES = Object.freeze({
  forging: Object.freeze({ fire: 0.12, earth: 0.08 }),
  farming: Object.freeze({ life: 0.1, water: 0.05 }),
  combat: Object.freeze({ fire: 0.15, air: 0.1 }),
  movement: Object.freeze({ air: 0.08 }),
  magic: Object.freeze({ arcane: 0.12 })
});

function classifyActivity(action = '') {
  const value = String(action).toLowerCase();

  if (value.includes('forge')) return 'forging';
  if (value.includes('farm') || value === 'forage') return 'farming';
  if (value.includes('combat') || value.includes('attack') || value.includes('fight')) return 'combat';
  if (value.includes('travel') || value.includes('move')) return 'movement';
  if (value.includes('magic') || value.includes('cast') || value.includes('spell')) return 'magic';
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

    Object.entries(ACTIVITY_PROFILES[activity]).forEach(([field, value]) => {
      byTile[entry.tileId].fields[field] += value;
    });
    byTile[entry.tileId].activities.push(activity);
    byTile[entry.tileId].actions.push(entry.action || entry.actionSelected);
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
