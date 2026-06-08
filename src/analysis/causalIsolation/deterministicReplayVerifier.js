function verifyDeterministicReplay(firstResult, secondResult) {
  const phaseAEqual = JSON.stringify(firstResult?.scoringResult) === JSON.stringify(secondResult?.scoringResult);
  const phaseBEqual = JSON.stringify(firstResult?.enrichmentResult) === JSON.stringify(secondResult?.enrichmentResult);
  const phaseCEqual = JSON.stringify(firstResult?.resolutionResult) === JSON.stringify(secondResult?.resolutionResult);

  return Object.freeze({
    phaseAHashFirst: firstResult?.scoringResult?.deterministicSeedHash,
    phaseAHashSecond: secondResult?.scoringResult?.deterministicSeedHash,
    phaseAEqual,
    phaseBEqual,
    phaseCEqual,
    valid: phaseAEqual && phaseBEqual && phaseCEqual
  });
}

module.exports = {
  verifyDeterministicReplay
};
