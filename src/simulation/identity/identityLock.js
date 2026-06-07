const { deriveIdentities } = require('./identityDerivation');

function freezeIdentitySnapshot(identities = []) {
  return Object.freeze([...identities]);
}

function beginIdentityFreeTick(agent) {
  const previous = [...(agent.identities || [])];
  if (Object.prototype.hasOwnProperty.call(agent, 'identities')) {
    delete agent.identities;
  }
  return previous;
}

function createIdentityFreeDecisionView(agent) {
  return {
    id: agent.id,
    location: agent.location,
    hp: agent.hp,
    stamina: agent.stamina,
    traits: agent.traits,
    skills: agent.skills,
    knowledge: agent.knowledge,
    needs: agent.needs,
    affinities: agent.affinities,
    mana: agent.mana,
    memory: agent.memory,
    trustMap: agent.trustMap
  };
}

function derivePostTickIdentity(agent) {
  return freezeIdentitySnapshot(deriveIdentities({
    skills: agent.skills,
    traits: agent.traits,
    knowledge: agent.knowledge,
    socialMemory: agent.memory
  }));
}

function installIdentitySnapshot(agent, identities) {
  const snapshot = freezeIdentitySnapshot(identities);
  Object.defineProperty(agent, 'identities', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: snapshot
  });
  return snapshot;
}

function applyPostTickIdentity(agent, previous = []) {
  const after = installIdentitySnapshot(agent, derivePostTickIdentity(agent));
  return Object.freeze({
    before: freezeIdentitySnapshot(previous),
    after,
    added: freezeIdentitySnapshot(after.filter(identity => !previous.includes(identity))),
    removed: freezeIdentitySnapshot(previous.filter(identity => !after.includes(identity)))
  });
}

module.exports = {
  applyPostTickIdentity,
  beginIdentityFreeTick,
  createIdentityFreeDecisionView,
  derivePostTickIdentity,
  freezeIdentitySnapshot,
  installIdentitySnapshot
};
