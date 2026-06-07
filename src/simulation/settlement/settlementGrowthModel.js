const { clamp01 } = require('./settlementMetrics');

function overlapCount(first = [], second = []) {
  const secondSet = new Set(second);
  return first.filter(tile => secondSet.has(tile)).length;
}

function evolveSettlements(previous = [], current = []) {
  const previousMatches = current.map(settlement => previous
    .filter(candidate => overlapCount(settlement.tiles, candidate.tiles) > 0));
  const currentMatches = previous.map(settlement => current
    .filter(candidate => overlapCount(settlement.tiles, candidate.tiles) > 0));
  const events = [];

  previousMatches.forEach((matches, index) => {
    if (matches.length > 1) {
      events.push({ type: 'merge', settlementId: current[index].id, from: matches.map(match => match.id) });
    }
  });
  currentMatches.forEach((matches, index) => {
    if (matches.length > 1) {
      events.push({ type: 'split', settlementId: previous[index].id, into: matches.map(match => match.id) });
    }
  });

  const settlements = current.map((settlement, index) => {
    const previousSettlement = previousMatches[index]
      .slice()
      .sort((first, second) => overlapCount(settlement.tiles, second.tiles)
        - overlapCount(settlement.tiles, first.tiles))[0];
    const previousActivity = previousSettlement?.activityCount || 0;
    const growthRate = previousActivity
      ? (settlement.activityCount - previousActivity) / previousActivity
      : 1;

    return {
      ...settlement,
      growthRate: Math.max(-1, Math.min(1, growthRate)),
      decayRisk: clamp01(1 - settlement.persistenceScore),
      metrics: {
        ...settlement.metrics,
        growthRate: Math.max(-1, Math.min(1, growthRate)),
        decayRisk: clamp01(1 - settlement.persistenceScore)
      },
      trend: growthRate > 0.05 ? 'growth' : growthRate < -0.05 ? 'decay' : 'stable'
    };
  });

  return { settlements, events };
}

module.exports = {
  evolveSettlements,
  overlapCount
};
