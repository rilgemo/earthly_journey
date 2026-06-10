const { resolveConditionSignals } = require('../life/conditionCapacityModel');

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function isEligible(agent) {
  if (agent.life?.alive === false || agent._pendingDeath) return false;
  if (agent.life?.lifeStage && agent.life.lifeStage !== 'adult') return false;
  const signals = resolveConditionSignals(agent.biology);
  return signals.collapsedDimensions.length === 0;
}

function directedBondSignal(source, targetId) {
  const entries = [
    ...(source.memory?.shortTerm || []),
    ...(source.memory?.longTerm || []),
    ...(source.memory?.recentEvents || [])
  ].filter(m => m.target === targetId || m.agentId === targetId || m.sourceId === targetId);

  if (!entries.length) return 0;
  return clamp(entries.reduce((sum, m) => sum + clamp((m.strength || 0) / 100), 0) / entries.length);
}

function bondAffinity(agentA, agentB) {
  return clamp((directedBondSignal(agentA, agentB.id) + directedBondSignal(agentB, agentA.id)) / 2);
}

function computeMatingEvents(agents = []) {
  const eligible = agents.filter(isEligible);
  const sorted = eligible.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const events = [];

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const agentA = sorted[i];
      const agentB = sorted[j];

      if (agentA.location !== agentB.location) continue;

      const affinity = bondAffinity(agentA, agentB);
      if (affinity <= 0) continue;

      events.push(Object.freeze({
        pair: Object.freeze([agentA.id, agentB.id]),
        affinity
      }));
    }
  }

  return Object.freeze(events);
}

module.exports = { computeMatingEvents };
