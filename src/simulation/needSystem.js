const NEED_WEIGHTS = Object.freeze({
  hunger: 1,
  fatigue: 1,
  manaNeed: 1,
  socialNeed: 0.5,
  safetyNeed: 0.8
});

function toNeedScale(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
}

function clampNeed(value) {
  return Math.max(0, Math.min(100, value));
}

function getNeedProfile(agent, world) {
  const needs = agent.needs || {};
  const manaCapacity = agent.mana?.capacity || 1;
  const manaCurrent = agent.mana?.current || 0;

  const result = {
    hunger: clampNeed(toNeedScale(needs.hunger)),
    fatigue: clampNeed(toNeedScale(needs.fatigue ?? needs.rest)),
    // Derived every tick from live mana state
    // DO NOT persist into agent.needs
    manaNeed: clampNeed(toNeedScale(1 - (manaCurrent / manaCapacity))),
    socialNeed: clampNeed(toNeedScale(needs.socialNeed ?? needs.curiosity ?? 0)),
    safetyNeed: clampNeed(toNeedScale(needs.safetyNeed ?? 0))
  };

  if (process.env.DEBUG_SIMULATION === 'true') {
    console.log('[manaNeed]', {
      tick: world?.tick,
      manaCurrent,
      manaNeed: result.manaNeed,
      rawFallbackUsed: needs.manaNeed === undefined
    });
  }

  return result;
}

function evaluateNeeds(agent) {
  const profile = getNeedProfile(agent);
  const weights = NEED_WEIGHTS;
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
  if (agent.needs.manaNeed !== undefined) {
    delete agent.needs.manaNeed;
  }
  agent.needs.socialNeed = clampNeed(profile.socialNeed + 0.2);
  agent.needs.safetyNeed = clampNeed(profile.safetyNeed);

  return getNeedProfile(agent);
}

module.exports = {
  evaluateNeeds,
  getNeedProfile,
  advanceNeeds
};
