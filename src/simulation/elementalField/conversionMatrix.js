const { cloneFieldState } = require('./fieldState');

const CONVERSION_MATRIX = Object.freeze([
  Object.freeze({ from: 'fire', to: 'air', weight: 0.5 }),
  Object.freeze({ from: 'fire', to: 'earth', weight: 0.3 }),
  Object.freeze({ from: 'fire', to: 'life', weight: 0.2 }),
  Object.freeze({ from: 'water', to: 'life', weight: 0.6 }),
  Object.freeze({ from: 'water', to: 'earth', weight: 0.4 }),
  Object.freeze({ from: 'life', to: 'arcane', weight: 1 }),
  Object.freeze({ from: 'arcane', to: 'fire', weight: 1 })
]);

function applyConversions(tiles, conversionRate = 0.01, matrix = CONVERSION_MATRIX) {
  const rate = Math.max(0, Math.min(1, Number(conversionRate) || 0));
  const next = Object.fromEntries(
    Object.entries(tiles).map(([tileId, tile]) => [
      tileId,
      { ...tile, field: cloneFieldState(tile.field) }
    ])
  );
  const conversionEvents = [];
  const grouped = matrix.reduce((groups, rule) => {
    if (!groups[rule.from]) groups[rule.from] = [];
    groups[rule.from].push(rule);
    return groups;
  }, {});

  Object.entries(tiles).forEach(([tileId, tile]) => {
    Object.entries(grouped).forEach(([sourceField, rules]) => {
      const sourceValue = tile.field[sourceField] || 0;
      const convertedTotal = sourceValue * rate;
      if (convertedTotal <= 0) return;

      const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0) || 1;
      next[tileId].field[sourceField] -= convertedTotal;

      rules.forEach(rule => {
        const amount = convertedTotal * (rule.weight / totalWeight);
        next[tileId].field[rule.to] += amount;
        conversionEvents.push({
          tileId,
          from: sourceField,
          to: rule.to,
          amount
        });
      });
    });
  });

  return { tiles: next, conversionEvents };
}

module.exports = {
  CONVERSION_MATRIX,
  applyConversions
};
