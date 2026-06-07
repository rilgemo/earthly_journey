const { RESOURCE_TYPES, getTileResourceContext, tileId } = require('../resourceGeography/resourceMap');

const FIELD_TYPES = Object.freeze(['fire', 'water', 'earth', 'life', 'arcane']);

function parseTilePoint(id) {
  const match = String(id || '').match(/(-?\d+)-(-?\d+)$/);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

function getNeighborTileIds(id) {
  const point = parseTilePoint(id);
  if (!point) return [];
  return [
    tileId(point.x + 1, point.y),
    tileId(point.x - 1, point.y),
    tileId(point.x, point.y + 1),
    tileId(point.x, point.y - 1)
  ];
}

function normalizeResourceTile(tile = {}) {
  return Object.fromEntries(RESOURCE_TYPES.map(type => [type, (tile[type] || 0) / 100]));
}

function normalizeField(field = {}) {
  return Object.fromEntries(FIELD_TYPES.map(type => [type, Math.max(0, Math.min(1, (field[type] || 0) / 100))]));
}

function getEnvironmentalYieldContext({ world, tileId: location, field }) {
  const resourceMap = world?.resourceMap || world?.resourceGeography?.map || null;
  const tileResource = getTileResourceContext(resourceMap, location) || {};
  const neighbors = getNeighborTileIds(location)
    .map(id => getTileResourceContext(resourceMap, id))
    .filter(Boolean);

  return {
    tileId: location,
    resourceContext: normalizeResourceTile(tileResource),
    fieldContext: normalizeField(field || world?.getField?.(location) || {}),
    neighborResources: neighbors.map(normalizeResourceTile)
  };
}

module.exports = {
  FIELD_TYPES,
  getEnvironmentalYieldContext,
  getNeighborTileIds,
  normalizeField,
  normalizeResourceTile,
  parseTilePoint
};
