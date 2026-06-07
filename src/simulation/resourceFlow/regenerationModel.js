const { RESOURCE_TYPES } = require('../resourceGeography/resourceMap');

const FIELD_BIAS = Object.freeze({
  foodPotential: ['life', 'water'],
  waterPotential: ['water'],
  materialPotential: ['earth', 'fire'],
  arcanePotential: ['arcane']
});

function fieldBiasFor(resourceType, field = {}) {
  const keys = FIELD_BIAS[resourceType] || [];
  if (!keys.length) return 1;
  const average = keys.reduce((sum, key) => sum + Math.max(0, field[key] || 0), 0) / keys.length;
  return 1 + Math.min(0.5, average / 300);
}

function applyRegeneration(tiles, baselineTiles = {}, world = {}, { regenRate = 0.02 } = {}) {
  const deltas = {};

  Object.entries(tiles).forEach(([tileId, tile]) => {
    const baseline = baselineTiles[tileId] || tile;
    let field = world.areas?.get?.(tileId)?.field || {};
    if (!Object.keys(field).length && typeof world.getField === 'function') {
      try {
        field = world.getField(tileId) || {};
      } catch (error) {
        field = {};
      }
    }
    deltas[tileId] = {};
    RESOURCE_TYPES.forEach(resourceType => {
      const delta = ((baseline[resourceType] || 0) - (tile[resourceType] || 0))
        * regenRate
        * fieldBiasFor(resourceType, field);
      tile[resourceType] = (tile[resourceType] || 0) + delta;
      deltas[tileId][resourceType] = delta;
    });
  });

  return { tiles, deltas };
}

module.exports = {
  FIELD_BIAS,
  applyRegeneration,
  fieldBiasFor
};
