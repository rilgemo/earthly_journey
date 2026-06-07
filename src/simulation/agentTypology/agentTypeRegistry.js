const AGENT_TYPE_REGISTRY = Object.freeze({
  human_like: Object.freeze({
    typeId: 'human_like',
    label: 'Human-like Agent',
    stabilityProfile: 'balanced',
    fieldSensitivity: Object.freeze({ general: 1.0, elemental: 1.0, environmental: 1.0 }),
    socialCouplingStrength: 1.3,
    memoryPersistenceBias: 1.0,
    actionVolatility: 1.0,
    resourceDependenceProfile: Object.freeze({ food: 1.0, shelter: 1.0, tools: 1.0, safety: 1.0 }),
    categoryWeights: Object.freeze({ social: 1.2, survival: 1.0, economic: 1.0, exploration: 1.0, combat: 0.9, magic: 1.0 })
  }),
  animal_like: Object.freeze({
    typeId: 'animal_like',
    label: 'Animal-like Agent',
    stabilityProfile: 'environment-bound',
    fieldSensitivity: Object.freeze({ general: 1.4, elemental: 1.2, environmental: 1.6 }),
    socialCouplingStrength: 0.5,
    memoryPersistenceBias: 0.65,
    actionVolatility: 1.35,
    resourceDependenceProfile: Object.freeze({ food: 1.6, shelter: 1.2, tools: 0.1, safety: 1.5 }),
    categoryWeights: Object.freeze({ social: 0.5, survival: 1.45, economic: 0.4, exploration: 1.15, combat: 0.9, magic: 0.2 })
  }),
  monster_like: Object.freeze({
    typeId: 'monster_like',
    label: 'Monster-like Agent',
    stabilityProfile: 'territorial',
    fieldSensitivity: Object.freeze({ general: 1.25, elemental: 1.5, environmental: 1.2 }),
    socialCouplingStrength: 0.25,
    memoryPersistenceBias: 0.8,
    actionVolatility: 1.45,
    resourceDependenceProfile: Object.freeze({ food: 1.2, shelter: 0.8, tools: 0.0, safety: 0.7 }),
    categoryWeights: Object.freeze({ social: 0.25, survival: 1.1, economic: 0.2, exploration: 0.9, combat: 1.7, magic: 1.1 })
  }),
  collective: Object.freeze({
    typeId: 'collective',
    label: 'Collective Agent',
    stabilityProfile: 'distributed',
    fieldSensitivity: Object.freeze({ general: 1.1, elemental: 1.0, environmental: 1.2 }),
    socialCouplingStrength: 1.8,
    memoryPersistenceBias: 1.35,
    actionVolatility: 0.7,
    resourceDependenceProfile: Object.freeze({ food: 1.2, shelter: 1.4, tools: 1.2, safety: 1.5 }),
    categoryWeights: Object.freeze({ social: 1.5, survival: 1.1, economic: 1.25, exploration: 0.7, combat: 0.8, magic: 0.6 })
  })
});

const AGENT_TYPE_ALIASES = Object.freeze({
  npc: 'human_like',
  human: 'human_like',
  villager: 'human_like',
  animal: 'animal_like',
  rabbit: 'animal_like',
  deer: 'animal_like',
  monster: 'monster_like',
  beast: 'monster_like',
  swarm: 'collective',
  settlement_cluster: 'collective',
  settlement: 'collective'
});

function getAgentTypeProfile(typeId = 'human_like') {
  const resolved = AGENT_TYPE_ALIASES[typeId] || typeId;
  return AGENT_TYPE_REGISTRY[resolved] || AGENT_TYPE_REGISTRY.human_like;
}

module.exports = {
  AGENT_TYPE_REGISTRY,
  AGENT_TYPE_ALIASES,
  getAgentTypeProfile
};
