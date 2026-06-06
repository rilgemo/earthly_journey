const { createFieldDelta } = require('../elementalField/fieldState');
const { ACTIVITY_PROFILES, classifyActivity } = require('./activityFieldCoupler');

function updateActivityHistory(previousHistory = {}, agentLog = []) {
  const history = Object.fromEntries(
    Object.entries(previousHistory).map(([tileId, actions]) => [tileId, { ...actions }])
  );

  agentLog.forEach(entry => {
    const action = entry.action || entry.actionSelected;
    if (!entry.tileId || !classifyActivity(action)) return;
    if (!history[entry.tileId]) history[entry.tileId] = {};
    history[entry.tileId][action] = (history[entry.tileId][action] || 0) + 1;
  });

  return history;
}

function createMemoryFieldImprints(history = {}, config = {}) {
  const repeatThreshold = config.repeatThreshold ?? 3;
  const driftPerRepeat = config.driftPerRepeat ?? 0.02;
  const maxDriftScale = config.maxDriftScale ?? 5;
  const perturbations = [];

  Object.keys(history).sort().forEach(tileId => {
    Object.keys(history[tileId]).sort().forEach(action => {
      const count = history[tileId][action];
      const activity = classifyActivity(action);
      if (!activity || count < repeatThreshold) return;

      const scale = Math.min(maxDriftScale, (count - repeatThreshold + 1) * driftPerRepeat);
      const profile = ACTIVITY_PROFILES[activity];
      const fields = Object.fromEntries(
        Object.entries(profile).map(([field, value]) => [field, value * scale])
      );

      perturbations.push({
        tileId,
        fields: createFieldDelta(fields),
        source: 'memory',
        action,
        repetitions: count
      });
    });
  });

  return perturbations;
}

function imprintMemoryToFields(previousHistory = {}, agentLog = [], config = {}) {
  const history = updateActivityHistory(previousHistory, agentLog);
  return {
    history,
    perturbations: createMemoryFieldImprints(history, config)
  };
}

module.exports = {
  updateActivityHistory,
  createMemoryFieldImprints,
  imprintMemoryToFields
};
