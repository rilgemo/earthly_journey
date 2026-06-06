function governSocialStability(metrics, current = {}) {
  const instability = metrics.socialInstabilityIndex || 0;
  const recovery = instability < 0.2 ? 0.1 : 0;
  const dampening = 1 - (instability * 0.35);
  const recover = value => value + ((1 - value) * recovery);

  return {
    socialInfluenceWeight: Math.max(0.25, Math.min(1.5, recover(current.socialInfluenceWeight ?? 1) * dampening)),
    memoryPropagationStrength: Math.max(0.25, Math.min(1.5, recover(current.memoryPropagationStrength ?? 1) * dampening)),
    socialCouplingGain: Math.max(0.25, Math.min(1.5, recover(current.socialCouplingGain ?? 1) * dampening))
  };
}

module.exports = { governSocialStability };
