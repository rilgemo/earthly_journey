function compressPatterns(patterns = []) {
  const grouped = patterns.reduce((result, pattern) => {
    if (!result[pattern.key]) {
      result[pattern.key] = {
        memoryType: pattern.type,
        key: pattern.key,
        sources: new Set(),
        count: 0
      };
    }
    result[pattern.key].sources.add(pattern.source);
    result[pattern.key].count += pattern.count || 1;
    return result;
  }, {});

  const compressed = Object.values(grouped)
    .map(node => Object.freeze({
      memoryType: node.memoryType,
      key: node.key,
      sources: Object.freeze([...node.sources].sort()),
      weight: Number(node.count.toFixed(4))
    }))
    .sort((first, second) => first.key.localeCompare(second.key));

  return Object.freeze({
    compressedPatterns: Object.freeze(compressed),
    compressionRatio: patterns.length
      ? Number((compressed.length / patterns.length).toFixed(4))
      : 1
  });
}

module.exports = {
  compressPatterns
};
