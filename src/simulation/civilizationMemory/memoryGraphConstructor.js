function constructMemoryGraph(compressedPatterns = []) {
  const nodes = compressedPatterns.map(pattern => Object.freeze({
    id: pattern.key,
    type: pattern.memoryType,
    weight: pattern.weight,
    sources: pattern.sources
  }));
  const edges = [];

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const current = nodes[index];
    const next = nodes[index + 1];
    const shared = current.sources.filter(source => next.sources.includes(source));
    if (shared.length) {
      edges.push(Object.freeze({
        from: current.id,
        to: next.id,
        relation: 'co_persistent',
        sharedSources: Object.freeze(shared)
      }));
    }
  }

  return Object.freeze({
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges)
  });
}

module.exports = {
  constructMemoryGraph
};
