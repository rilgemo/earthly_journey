const intentPipeline = require('../../simulation/intent/intentPipeline');

function verifyDeterministicReplay(agent, actions, context = {}) {
  const first = intentPipeline.execute(agent, actions, context);
  const second = intentPipeline.execute(agent, actions, context);
  const phaseAEqual = JSON.stringify(first.scoringResult) === JSON.stringify(second.scoringResult);
  const phaseBEqual = JSON.stringify(first.enrichmentResult) === JSON.stringify(second.enrichmentResult);
  const phaseCEqual = JSON.stringify(first.resolutionResult) === JSON.stringify(second.resolutionResult);

  return Object.freeze({
    phaseAHashFirst: first.scoringResult.deterministicSeedHash,
    phaseAHashSecond: second.scoringResult.deterministicSeedHash,
    phaseAEqual,
    phaseBEqual,
    phaseCEqual,
    valid: phaseAEqual && phaseBEqual && phaseCEqual
  });
}

module.exports = {
  verifyDeterministicReplay
};
