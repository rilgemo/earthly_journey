const IDENTITY_LEAK_ERROR = 'Identity leakage into decision layer detected';
const IDENTITY_KEYS = new Set(['identity', 'identities', 'identityChanges']);

function containsIdentity(value, visited = new Set()) {
  if (!value || typeof value !== 'object') return false;
  if (visited.has(value)) return false;
  visited.add(value);

  if (Object.keys(value).some(key => IDENTITY_KEYS.has(key))) {
    return true;
  }

  return Object.values(value).some(child => containsIdentity(child, visited));
}

function assertNoIdentityLeak(context) {
  if (containsIdentity(context)) {
    throw new Error(IDENTITY_LEAK_ERROR);
  }
  return context;
}

module.exports = {
  IDENTITY_LEAK_ERROR,
  assertNoIdentityLeak,
  containsIdentity
};
