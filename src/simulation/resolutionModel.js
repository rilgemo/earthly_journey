const { assertNoIdentityLeak } = require('./identity/identityGuard');

function resolveIntent(intents, context = {}) {
  assertNoIdentityLeak({ intents, context });
  if (!intents.length) return null;

  return intents.reduce((best, intent) => {
    if (!best) return intent;
    return intent.score > best.score ? intent : best;
  }, null);
}

module.exports = {
  resolveIntent
};
