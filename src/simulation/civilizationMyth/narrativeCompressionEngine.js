function compressNarratives(civilizationMemory = {}, symbolicEntities = []) {
  const patterns = civilizationMemory.persistentPatterns || [];
  return Object.freeze(patterns.map(pattern => {
    const symbol = symbolicEntities.find(entity => entity.sourceMemory === pattern.key);
    return Object.freeze({
      statementId: `narrative:${pattern.key}`,
      sourceMemory: pattern.key,
      text: `${symbol?.symbolicEntity || 'The Pattern'} explains ${pattern.key}`,
      weight: pattern.weight || 0
    });
  }).sort((first, second) => first.statementId.localeCompare(second.statementId)));
}

module.exports = {
  compressNarratives
};
