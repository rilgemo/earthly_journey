const DEFAULT_TRUST = 50;

function getTrust(agent, sourceId) {
  const value = agent.trustMap?.[sourceId];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_TRUST;
  }

  return Math.max(0, Math.min(100, value));
}

function getTrustFactor(agent, sourceId) {
  return getTrust(agent, sourceId) / 100;
}

module.exports = {
  DEFAULT_TRUST,
  getTrust,
  getTrustFactor
};
