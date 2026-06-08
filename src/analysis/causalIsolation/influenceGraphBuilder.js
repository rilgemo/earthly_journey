function node(id, type, label = id) {
  return Object.freeze({ id, type, label });
}

function edge(from, to, relation) {
  return Object.freeze({ from, to, relation });
}

function buildInfluenceGraph({ agentId = 'agent', intents = [] } = {}) {
  const systemNodes = ['Typology', 'Demand', 'Field', 'Memory'].map(system => node(system, 'system'));
  const phaseNodes = ['Phase A', 'Phase B', 'Phase C'].map(phase => node(phase, 'phase'));
  const intentNodes = intents.map(intent => node(`intent:${intent.intent || intent}`, 'intent', intent.intent || intent));
  const nodes = Object.freeze([
    node(agentId, 'agent'),
    ...systemNodes,
    ...phaseNodes,
    ...intentNodes
  ]);
  const edges = Object.freeze([
    ...systemNodes.map(system => edge(system.id, 'Phase A', 'contributes_to')),
    edge('Phase A', 'Phase B', 'modifies_metadata'),
    edge('Phase B', 'Phase C', 'influences_selection'),
    ...intentNodes.map(intent => edge('Phase C', intent.id, 'influences_selection'))
  ]);

  return Object.freeze({ nodes, edges });
}

module.exports = {
  buildInfluenceGraph
};
