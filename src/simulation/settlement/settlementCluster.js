function parseTilePoint(tileId) {
  const match = String(tileId || '').match(/(-?\d+)-(-?\d+)$/);
  return match
    ? { x: Number(match[1]), y: Number(match[2]) }
    : null;
}

function tileDistance(firstId, secondId) {
  if (firstId === secondId) return 0;
  const first = parseTilePoint(firstId);
  const second = parseTilePoint(secondId);
  if (!first || !second) return Infinity;
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

function clusterTiles(tileStats, neighborDistance = 1) {
  const remaining = new Set(Object.keys(tileStats).sort());
  const clusters = [];

  while (remaining.size) {
    const start = remaining.values().next().value;
    const queue = [start];
    const tiles = [];
    remaining.delete(start);

    while (queue.length) {
      const tileId = queue.shift();
      tiles.push(tileId);
      [...remaining].forEach(candidate => {
        if (tileDistance(tileId, candidate) <= neighborDistance) {
          remaining.delete(candidate);
          queue.push(candidate);
        }
      });
    }

    clusters.push(tiles.sort());
  }

  return clusters;
}

function calculateCenterPoint(tileIds) {
  const points = tileIds.map(parseTilePoint).filter(Boolean);
  if (!points.length) return { tileId: tileIds[0] || null, x: null, y: null };
  return {
    tileId: tileIds.slice().sort()[0],
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
}

function calculateRadius(tileIds, centerPoint) {
  if (centerPoint.x === null) return 0;
  return tileIds.reduce((radius, tileId) => {
    const point = parseTilePoint(tileId);
    if (!point) return radius;
    const distance = Math.abs(point.x - centerPoint.x) + Math.abs(point.y - centerPoint.y);
    return Math.max(radius, distance);
  }, 0);
}

module.exports = {
  calculateCenterPoint,
  calculateRadius,
  clusterTiles,
  parseTilePoint,
  tileDistance
};
