const { createFieldDelta } = require('../elementalField/fieldState');
const { classifyActivity } = require('./activityFieldCoupler');

function coupleSocialDensityToFields(agents = [], agentLog = [], config = {}) {
  const highDensityThreshold = config.highDensityThreshold ?? 3;
  const settlementThreshold = config.settlementThreshold ?? 2;
  const densityByTile = agents.reduce((counts, agent) => {
    if (agent.location) counts[agent.location] = (counts[agent.location] || 0) + 1;
    return counts;
  }, {});
  const conflictByTile = agentLog.reduce((counts, entry) => {
    if (entry.tileId && classifyActivity(entry.action || entry.actionSelected) === 'combat') {
      counts[entry.tileId] = (counts[entry.tileId] || 0) + 1;
    }
    return counts;
  }, {});

  return Object.keys(densityByTile).sort().flatMap(tileId => {
    const agentCount = densityByTile[tileId];
    const conflictCount = conflictByTile[tileId] || 0;
    const fields = {};

    if (agentCount >= highDensityThreshold) {
      fields.life = agentCount * 0.02;
      fields.arcane = agentCount * 0.015;
    }

    if (conflictCount > 0) {
      fields.fire = conflictCount * 0.1;
      fields.earth = conflictCount * -0.05;
    } else if (agentCount >= settlementThreshold) {
      fields.life = (fields.life || 0) + 0.02;
      fields.water = 0.02;
    }

    if (!Object.keys(fields).length) return [];

    return [{
      tileId,
      fields: createFieldDelta(fields),
      source: 'social',
      agentCount,
      conflictCount
    }];
  });
}

module.exports = {
  coupleSocialDensityToFields
};
