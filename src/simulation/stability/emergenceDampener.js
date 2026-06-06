function dampenEmergence(metrics, current = {}) {
  const instability = metrics.emergenceInstabilityIndex || 0;
  const recovery = instability < 0.2 ? 0.1 : 0;
  const dampening = 1 - (instability * 0.4);
  const recover = value => value + ((1 - value) * recovery);

  return {
    emergenceCouplingGain: Math.max(0.2, Math.min(1.5, recover(current.emergenceCouplingGain ?? 1) * dampening)),
    memoryImprintRate: Math.max(0.2, Math.min(1.5, recover(current.memoryImprintRate ?? 1) * dampening)),
    repeatedActionReinforcementStrength: Math.max(
      0.2,
      Math.min(1.5, recover(current.repeatedActionReinforcementStrength ?? 1) * dampening)
    )
  };
}

module.exports = { dampenEmergence };
