const { FIELD_TYPES, cloneFieldState } = require('./fieldState');

function restoreEquilibrium(tiles, regenRate = 0.01) {
  const rate = Math.max(0, Math.min(1, Number(regenRate) || 0));
  const equilibriumDelta = {};
  const next = Object.fromEntries(
    Object.entries(tiles).map(([tileId, tile]) => {
      const field = cloneFieldState(tile.field);
      const baseline = cloneFieldState(tile.baselineField);
      equilibriumDelta[tileId] = {};

      FIELD_TYPES.forEach(fieldType => {
        const delta = (baseline[fieldType] - field[fieldType]) * rate;
        field[fieldType] = Math.max(0, field[fieldType] + delta);
        equilibriumDelta[tileId][fieldType] = delta;
      });

      return [tileId, { ...tile, field }];
    })
  );

  return { tiles: next, equilibriumDelta };
}

module.exports = {
  restoreEquilibrium
};
