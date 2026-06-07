const { freezeSnapshot } = require('../behavior/behaviorTraceRecorder');
const { cloneSnapshot } = require('../replayBuffer');

const RESOURCE_TYPES = Object.freeze([
  'foodPotential',
  'waterPotential',
  'materialPotential',
  'arcanePotential'
]);

function clampResource(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function tileId(x, y) {
  return `tile-${x}-${y}`;
}

function createResourceTile({ x, y, ...values }) {
  return freezeSnapshot({
    x,
    y,
    ...Object.fromEntries(RESOURCE_TYPES.map(type => [type, clampResource(values[type] || 0)]))
  });
}

function createResourceMap({ width, height, tiles = {} }) {
  const normalizedTiles = {};

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const id = tileId(x, y);
      normalizedTiles[id] = createResourceTile({ x, y, ...(tiles[id] || {}) });
    }
  }

  return freezeSnapshot({
    width,
    height,
    tiles: normalizedTiles
  });
}

function getTileResourceContext(resourceMap, tileRef) {
  const id = typeof tileRef === 'string' ? tileRef : tileId(tileRef?.x || 0, tileRef?.y || 0);
  const tile = resourceMap?.tiles?.[id] || null;
  return tile ? freezeSnapshot(cloneSnapshot(tile)) : null;
}

module.exports = {
  RESOURCE_TYPES,
  clampResource,
  createResourceMap,
  createResourceTile,
  getTileResourceContext,
  tileId
};
