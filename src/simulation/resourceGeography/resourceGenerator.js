const { RESOURCE_TYPES, clampResource, createResourceMap, tileId } = require('./resourceMap');
const { createResourceTopology, influenceAt } = require('./resourceTopology');

function baseGradient(resourceType, x, y, width, height) {
  const nx = width <= 1 ? 0 : x / (width - 1);
  const ny = height <= 1 ? 0 : y / (height - 1);

  if (resourceType === 'foodPotential') return 18 + ((1 - Math.abs(ny - 0.55)) * 22);
  if (resourceType === 'waterPotential') return 12 + ((1 - Math.abs(nx - 0.5)) * 30);
  if (resourceType === 'materialPotential') return 15 + (ny * 28);
  if (resourceType === 'arcanePotential') return 10 + (Math.abs(nx - ny) * 24);
  return 0;
}

function generateResourceMap({ width, height, seed = 12345 } = {}) {
  const topology = createResourceTopology({ width, height, seed });
  const tiles = {};

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const values = {};
      RESOURCE_TYPES.forEach(resourceType => {
        const regional = topology.regions
          .filter(region => region.resourceType === resourceType)
          .reduce((sum, region) => sum + influenceAt(region, x, y), 0);
        values[resourceType] = clampResource(baseGradient(resourceType, x, y, width, height) + regional);
      });
      tiles[tileId(x, y)] = values;
    }
  }

  return createResourceMap({ width, height, tiles });
}

module.exports = {
  baseGradient,
  generateResourceMap
};
