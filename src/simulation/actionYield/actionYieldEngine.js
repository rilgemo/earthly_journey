const { yieldResolver } = require('./yieldResolver');

function computeActionYield(action, context = {}) {
  return yieldResolver(action, context);
}

module.exports = {
  computeActionYield
};
