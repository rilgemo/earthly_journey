const { RESOURCE_TYPES, tileId } = require('../resourceGeography/resourceMap');

function neighborIds(tile) {
  return [
    tileId(tile.x + 1, tile.y),
    tileId(tile.x, tile.y + 1)
  ];
}

function applyDiffusion(tiles, { diffusionRate = 0.04, maxTransfer = 2 } = {}) {
  const vectors = [];

  Object.entries(tiles).forEach(([fromId, fromTile]) => {
    neighborIds(fromTile).forEach(toId => {
      const toTile = tiles[toId];
      if (!toTile) return;
      RESOURCE_TYPES.forEach(resourceType => {
        const diff = (fromTile[resourceType] || 0) - (toTile[resourceType] || 0);
        const transfer = Math.max(-maxTransfer, Math.min(maxTransfer, diff * diffusionRate));
        if (transfer === 0) return;
        fromTile[resourceType] -= transfer;
        toTile[resourceType] += transfer;
        vectors.push({
          from: transfer > 0 ? fromId : toId,
          to: transfer > 0 ? toId : fromId,
          resourceType,
          amount: Math.abs(transfer)
        });
      });
    });
  });

  return { tiles, vectors };
}

module.exports = {
  applyDiffusion,
  neighborIds
};
