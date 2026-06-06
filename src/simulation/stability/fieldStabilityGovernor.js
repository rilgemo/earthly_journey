function governFieldStability(metrics, current = {}) {
  const instability = metrics.fieldInstabilityIndex || 0;
  const recovery = instability < 0.2 ? 0.1 : 0;
  const diffusionBase = (current.diffusionGain ?? 1) + ((1 - (current.diffusionGain ?? 1)) * recovery);
  const conversionBase = (current.conversionGain ?? 1) + ((1 - (current.conversionGain ?? 1)) * recovery);
  const equilibriumBase = (current.equilibriumRestorationRate ?? 1)
    + ((1 - (current.equilibriumRestorationRate ?? 1)) * recovery);
  const diffusionGain = Math.max(0.2, Math.min(1.5, diffusionBase * (1 - (instability * 0.35))));
  const conversionGain = Math.max(0.2, Math.min(1.5, conversionBase * (1 - (instability * 0.25))));
  const equilibriumRestorationRate = Math.max(
    0.5,
    Math.min(2, equilibriumBase * (1 + (instability * 0.4)))
  );

  return {
    diffusionGain,
    conversionGain,
    equilibriumRestorationRate
  };
}

module.exports = { governFieldStability };
