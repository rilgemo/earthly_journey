const { coupleActivityToFields } = require('./activityFieldCoupler');
const { coupleSocialDensityToFields } = require('./socialFieldCoupler');
const { imprintMemoryToFields } = require('./memoryFieldImprint');

function scaleProposals(proposals, gain) {
  return proposals.map(proposal => ({
    ...proposal,
    fields: Object.fromEntries(
      Object.entries(proposal.fields).map(([field, value]) => [field, value * gain])
    )
  }));
}

function emergenceTickHook({ agents = [], agentLog = [], history = {}, config = {} } = {}) {
  const emergenceGains = config.gains?.emergence || {};
  const socialGains = config.gains?.social || {};
  const emergenceGain = emergenceGains.emergenceCouplingGain ?? 1;
  const activityCouplingLog = scaleProposals(coupleActivityToFields(agentLog), emergenceGain);
  const socialCouplingLog = scaleProposals(
    coupleSocialDensityToFields(agents, agentLog, config.social),
    emergenceGain * (socialGains.socialCouplingGain ?? 1)
  );
  const memoryResult = imprintMemoryToFields(history, agentLog, config.memory);
  const memoryImprintLog = scaleProposals(
    memoryResult.perturbations,
    emergenceGain
      * (emergenceGains.memoryImprintRate ?? 1)
      * (emergenceGains.repeatedActionReinforcementStrength ?? 1)
  );
  const perturbations = [
    ...activityCouplingLog,
    ...socialCouplingLog,
    ...memoryImprintLog
  ];

  return {
    perturbations,
    activityCouplingLog,
    socialCouplingLog,
    memoryImprintLog,
    finalPerturbationQueue: perturbations,
    history: memoryResult.history
  };
}

module.exports = {
  emergenceTickHook
};
