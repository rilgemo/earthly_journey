function buildIdentityNarrativeGraph({ narrativeStatements = [], symbolicEntities = [] } = {}) {
  const nodes = Object.freeze([
    ...narrativeStatements.map(statement => Object.freeze({
      id: statement.statementId,
      type: 'narrative',
      label: statement.text
    })),
    ...symbolicEntities.map(entity => Object.freeze({
      id: entity.symbolId,
      type: 'symbol',
      label: entity.symbolicEntity
    }))
  ]);
  const edges = Object.freeze(narrativeStatements.flatMap(statement => (
    symbolicEntities
      .filter(entity => entity.sourceMemory === statement.sourceMemory)
      .map(entity => Object.freeze({
        from: statement.statementId,
        to: entity.symbolId,
        relation: 'symbolizes'
      }))
  )));

  return Object.freeze({ nodes, edges });
}

module.exports = {
  buildIdentityNarrativeGraph
};
