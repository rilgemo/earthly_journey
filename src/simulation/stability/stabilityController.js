const { governFieldStability } = require('./fieldStabilityGovernor');
const { governSocialStability } = require('./socialStabilityGovernor');
const { dampenEmergence } = require('./emergenceDampener');
const { computeStabilityMetrics } = require('./stabilityMetrics');

const DEFAULT_GAINS = Object.freeze({
  field: Object.freeze({
    diffusionGain: 1,
    conversionGain: 1,
    equilibriumRestorationRate: 1
  }),
  social: Object.freeze({
    socialInfluenceWeight: 1,
    memoryPropagationStrength: 1,
    socialCouplingGain: 1
  }),
  emergence: Object.freeze({
    emergenceCouplingGain: 1,
    memoryImprintRate: 1,
    repeatedActionReinforcementStrength: 1
  })
});

function createStabilityGains(gains = {}) {
  const source = gains || {};
  return {
    field: { ...DEFAULT_GAINS.field, ...(source.field || {}) },
    social: { ...DEFAULT_GAINS.social, ...(source.social || {}) },
    emergence: { ...DEFAULT_GAINS.emergence, ...(source.emergence || {}) }
  };
}

function runStabilityController(input = {}) {
  const currentGains = createStabilityGains(input.currentGains);
  const metrics = computeStabilityMetrics(input);
  const adjustedGains = {
    field: governFieldStability(metrics, currentGains.field),
    social: governSocialStability(metrics, currentGains.social),
    emergence: dampenEmergence(metrics, currentGains.emergence)
  };
  const logs = [
    `field instability ${metrics.fieldInstabilityIndex.toFixed(3)} -> diffusion gain ${adjustedGains.field.diffusionGain.toFixed(3)}`,
    `social instability ${metrics.socialInstabilityIndex.toFixed(3)} -> social coupling gain ${adjustedGains.social.socialCouplingGain.toFixed(3)}`,
    `emergence instability ${metrics.emergenceInstabilityIndex.toFixed(3)} -> emergence gain ${adjustedGains.emergence.emergenceCouplingGain.toFixed(3)}`
  ];

  return { adjustedGains, metrics, logs };
}

module.exports = {
  DEFAULT_GAINS,
  createStabilityGains,
  runStabilityController
};
