const ROLE_WEIGHTS = {
  farmer: { hunger: 1.1, fatigue: 0.8, manaNeed: 0.4, socialNeed: 0.2, safetyNeed: 0.8 },
  mage: { hunger: 0.7, fatigue: 0.7, manaNeed: 1.4, socialNeed: 0.2, safetyNeed: 0.7 },
  blacksmith: { hunger: 0.8, fatigue: 1.1, manaNeed: 0.3, socialNeed: 0.2, safetyNeed: 0.6 },
  wolf: { hunger: 1.6, fatigue: 0.5, manaNeed: 0.1, socialNeed: 0.1, safetyNeed: 1.0 },
  default: { hunger: 1, fatigue: 1, manaNeed: 1, socialNeed: 0.5, safetyNeed: 0.8 }
};

function toNeedScale(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
}

function clampNeed(value) {
  return Math.max(0, Math.min(100, value));
}

function getNeedProfile(agent) {
  const needs = agent.needs || {};
  const manaCapacity = agent.mana?.capacity || 1;
  const manaCurrent = agent.mana?.current || 0;

  return {
    hunger: clampNeed(toNeedScale(needs.hunger)),
    fatigue: clampNeed(toNeedScale(needs.fatigue ?? needs.rest)),
    manaNeed: clampNeed(toNeedScale(needs.manaNeed ?? (1 - (manaCurrent / manaCapacity)))),
    socialNeed: clampNeed(toNeedScale(needs.socialNeed ?? needs.curiosity ?? 0)),
    safetyNeed: clampNeed(toNeedScale(needs.safetyNeed ?? 0))
  };
}

function evaluateNeeds(agent) {
  const profile = getNeedProfile(agent);
  const weights = ROLE_WEIGHTS[agent.role] || ROLE_WEIGHTS.default;
  const weighted = Object.entries(profile).reduce((sum, [need, value]) => {
    return sum + (value * (weights[need] || 1));
  }, 0);

  return {
    profile,
    weights,
    urgency: weighted / 100
  };
}

function advanceNeeds(agent) {
  if (!agent.needs) agent.needs = {};

  const profile = getNeedProfile(agent);
  agent.needs.hunger = clampNeed(profile.hunger + 1);
  agent.needs.fatigue = clampNeed(profile.fatigue + 0.5);
  agent.needs.manaNeed = clampNeed(profile.manaNeed);
  agent.needs.socialNeed = clampNeed(profile.socialNeed + 0.2);
  agent.needs.safetyNeed = clampNeed(profile.safetyNeed);

  return getNeedProfile(agent);
}

module.exports = {
  evaluateNeeds,
  getNeedProfile,
  advanceNeeds
};
