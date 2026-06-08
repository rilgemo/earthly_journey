function compareCausalTraces(first = {}, second = {}) {
  const differences = [];
  ['phaseAHash', 'phaseBMetadata', 'phaseCSelection', 'externalInfluenceVector', 'deterministicSeed']
    .forEach(key => {
      if (JSON.stringify(first[key]) !== JSON.stringify(second[key])) {
        differences.push(Object.freeze({ key, first: first[key], second: second[key] }));
      }
    });

  return Object.freeze({
    equal: differences.length === 0,
    differences: Object.freeze(differences)
  });
}

module.exports = {
  compareCausalTraces
};
