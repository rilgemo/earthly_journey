const { AGENT_TYPE_ALIASES } = require('./agentTypeRegistry');

function mapAgentToTypeId(agent = {}) {
  if (agent.typology?.typeId) return agent.typology.typeId;
  if (agent.agentType) return AGENT_TYPE_ALIASES[agent.agentType] || agent.agentType;
  if (agent.type) return AGENT_TYPE_ALIASES[agent.type] || agent.type;
  return 'human_like';
}

function mapArchetypeToTypeId(archetype) {
  return AGENT_TYPE_ALIASES[archetype] || archetype || 'human_like';
}

module.exports = {
  mapAgentToTypeId,
  mapArchetypeToTypeId
};
