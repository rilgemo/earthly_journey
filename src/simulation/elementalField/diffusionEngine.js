const { FIELD_TYPES, cloneFieldState } = require('./fieldState');

function diffuseFields(tiles, diffusionRate = 0.1) {
  const rate = Math.max(0, Math.min(1, Number(diffusionRate) || 0));
  const next = Object.fromEntries(
    Object.entries(tiles).map(([tileId, tile]) => [
      tileId,
      { ...tile, field: cloneFieldState(tile.field) }
    ])
  );
  const processedEdges = new Set();

  Object.entries(tiles).forEach(([tileId, tile]) => {
    (tile.neighbors || []).forEach(neighborId => {
      if (!tiles[neighborId]) return;

      const edgeKey = [tileId, neighborId].sort().join('::');
      if (processedEdges.has(edgeKey)) return;
      processedEdges.add(edgeKey);

      FIELD_TYPES.forEach(fieldType => {
        const current = tile.field[fieldType] || 0;
        const neighbor = tiles[neighborId].field[fieldType] || 0;
        const maxDegree = Math.max(
          1,
          (tile.neighbors || []).length,
          (tiles[neighborId].neighbors || []).length
        );
        const transfer = (neighbor - current) * (rate / maxDegree);

        next[tileId].field[fieldType] += transfer;
        next[neighborId].field[fieldType] -= transfer;
      });
    });
  });

  Object.values(next).forEach(tile => {
    FIELD_TYPES.forEach(fieldType => {
      tile.field[fieldType] = Math.max(0, tile.field[fieldType]);
    });
  });

  return next;
}

module.exports = {
  diffuseFields
};
