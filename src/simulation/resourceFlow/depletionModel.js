const YIELD_TO_RESOURCE = Object.freeze({
  food: 'foodPotential',
  water: 'waterPotential',
  material: 'materialPotential',
  arcane: 'arcanePotential'
});

function collectDepletion(actionYieldSnapshots = [], { depletionRate = 0.08 } = {}) {
  const byTile = {};
  const events = [];

  actionYieldSnapshots.filter(Boolean).forEach(snapshot => {
    const tileId = snapshot.tileContext?.tileId;
    if (!tileId) return;
    if (!byTile[tileId]) byTile[tileId] = {};

    Object.entries(snapshot.finalYield || {}).forEach(([yieldType, amount]) => {
      const resourceType = YIELD_TO_RESOURCE[yieldType];
      if (!resourceType) return;
      const depletion = Math.max(0, amount * depletionRate);
      byTile[tileId][resourceType] = (byTile[tileId][resourceType] || 0) + depletion;
      events.push({
        tileId,
        actionId: snapshot.actionId,
        yieldType,
        resourceType,
        amount: depletion
      });
    });
  });

  return { byTile, events };
}

function applyDepletion(tiles, depletionByTile = {}) {
  Object.entries(depletionByTile).forEach(([tileId, depletion]) => {
    const tile = tiles[tileId];
    if (!tile) return;
    Object.entries(depletion).forEach(([resourceType, amount]) => {
      tile[resourceType] = Math.max(0, (tile[resourceType] || 0) - amount);
    });
  });
  return tiles;
}

module.exports = {
  YIELD_TO_RESOURCE,
  applyDepletion,
  collectDepletion
};
