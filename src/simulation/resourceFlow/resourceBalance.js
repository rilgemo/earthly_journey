const { RESOURCE_TYPES, clampResource } = require('../resourceGeography/resourceMap');

function cloneTiles(resourceMap = {}) {
  return Object.fromEntries(Object.entries(resourceMap.tiles || {})
    .map(([tileId, tile]) => [tileId, { ...tile }]));
}

function totalResources(resourceMap = {}) {
  return Object.values(resourceMap.tiles || {}).reduce((totals, tile) => {
    RESOURCE_TYPES.forEach(type => {
      totals[type] = (totals[type] || 0) + (tile[type] || 0);
    });
    return totals;
  }, Object.fromEntries(RESOURCE_TYPES.map(type => [type, 0])));
}

function totalResourceValue(resourceMap = {}) {
  return Object.values(totalResources(resourceMap)).reduce((sum, value) => sum + value, 0);
}

function calculateBalance(preMap, postMap) {
  const before = totalResources(preMap);
  const after = totalResources(postMap);
  const delta = Object.fromEntries(RESOURCE_TYPES.map(type => [type, after[type] - before[type]]));
  const beforeTotal = Object.values(before).reduce((sum, value) => sum + value, 0);
  const afterTotal = Object.values(after).reduce((sum, value) => sum + value, 0);
  return Object.freeze({
    before,
    after,
    delta,
    totalDelta: afterTotal - beforeTotal,
    stabilityRatio: beforeTotal ? afterTotal / beforeTotal : 1
  });
}

function clampTile(tile) {
  return Object.fromEntries(Object.entries(tile).map(([key, value]) => [
    key,
    key === 'x' || key === 'y' ? value : clampResource(value)
  ]));
}

module.exports = {
  calculateBalance,
  clampTile,
  cloneTiles,
  totalResourceValue,
  totalResources
};
