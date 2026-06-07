const { RESOURCE_TYPES } = require('./resourceMap');

function createSeededRandom(seed = 12345) {
  let state = Number(seed) >>> 0;
  return function random() {
    state = ((state * 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createRegionCenter(rng, width, height, resourceType) {
  return {
    resourceType,
    x: rng() * Math.max(1, width - 1),
    y: rng() * Math.max(1, height - 1),
    radius: Math.max(width, height) * (0.25 + (rng() * 0.2)),
    strength: 35 + (rng() * 45)
  };
}

function createResourceTopology({ width, height, seed = 12345 } = {}) {
  const rng = createSeededRandom(seed);
  return Object.freeze({
    seed,
    width,
    height,
    regions: Object.freeze(RESOURCE_TYPES.flatMap(resourceType => ([
      createRegionCenter(rng, width, height, resourceType),
      createRegionCenter(rng, width, height, resourceType)
    ]).map(Object.freeze)))
  });
}

function influenceAt(region, x, y) {
  const dx = x - region.x;
  const dy = y - region.y;
  const distance = Math.sqrt((dx * dx) + (dy * dy));
  const falloff = Math.max(0, 1 - (distance / Math.max(1, region.radius)));
  return region.strength * falloff * falloff;
}

module.exports = {
  createResourceTopology,
  createSeededRandom,
  influenceAt
};
