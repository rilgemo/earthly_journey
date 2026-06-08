const SYMBOLS = Object.freeze({
  resource: 'The Giver',
  demand: 'The Hunger',
  culture: 'The Ancestors',
  behavior: 'The Old Way',
  settlement: 'The Hearth',
  migration: 'The Road'
});

function classifySymbol(node = {}) {
  const id = node.id || '';
  if (id.includes('demand:')) return SYMBOLS.demand;
  if (id.includes('resource:')) return SYMBOLS.resource;
  if (id.includes('culture:')) return SYMBOLS.culture;
  if (id.includes('behavior:')) return SYMBOLS.behavior;
  if (id.includes('settlement:')) return SYMBOLS.settlement;
  if (id.includes('migration:')) return SYMBOLS.migration;
  return 'The Unnamed Pattern';
}

function mapSymbolicEntities(memoryGraph = {}) {
  return Object.freeze((memoryGraph.nodes || []).map(node => Object.freeze({
    symbolId: `symbol:${node.id}`,
    sourceMemory: node.id,
    symbolicEntity: classifySymbol(node),
    weight: node.weight || 0
  })).sort((first, second) => first.symbolId.localeCompare(second.symbolId)));
}

module.exports = {
  SYMBOLS,
  classifySymbol,
  mapSymbolicEntities
};
