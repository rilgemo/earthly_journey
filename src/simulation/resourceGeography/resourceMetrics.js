const { RESOURCE_TYPES } = require('./resourceMap');

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function entropy(values = []) {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (!total) return 0;
  const raw = values.reduce((sum, value) => {
    const p = Math.max(0, value) / total;
    return p ? sum - (p * Math.log2(p)) : sum;
  }, 0);
  return clamp01(raw / Math.log2(values.length || 2));
}

function average(values = []) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function calculateResourceMetrics(resourceMap = {}) {
  const tiles = Object.values(resourceMap.tiles || {});
  const richnessByTile = tiles.map(tile => RESOURCE_TYPES
    .reduce((sum, type) => sum + (tile[type] || 0), 0) / (RESOURCE_TYPES.length * 100));
  const averages = Object.fromEntries(RESOURCE_TYPES.map(type => [
    type,
    average(tiles.map(tile => tile[type] || 0)) / 100
  ]));
  const richestRegions = tiles
    .map(tile => ({
      tileId: `tile-${tile.x}-${tile.y}`,
      richness: RESOURCE_TYPES.reduce((sum, type) => sum + (tile[type] || 0), 0) / (RESOURCE_TYPES.length * 100)
    }))
    .sort((first, second) => second.richness - first.richness || first.tileId.localeCompare(second.tileId))
    .slice(0, 5);

  return Object.freeze({
    regionalRichness: clamp01(average(richnessByTile)),
    resourceDiversity: entropy(Object.values(averages)),
    resourceConcentration: clamp01(Math.max(0, ...richnessByTile) - average(richnessByTile)),
    resourceEntropy: entropy(richnessByTile),
    averages: Object.freeze(averages),
    richestRegions: Object.freeze(richestRegions.map(Object.freeze))
  });
}

module.exports = {
  calculateResourceMetrics,
  clamp01,
  entropy
};
