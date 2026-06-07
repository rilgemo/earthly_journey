const { clamp01, normalizeTrust } = require('./interactionBalance');

function getTrustLevel(sourceId, targetId, trustGraph = {}) {
  if (!sourceId || !targetId || sourceId === targetId) return 0;
  const direct = trustGraph[sourceId]?.[targetId];
  if (direct !== undefined) return normalizeTrust(direct);
  return 0.5;
}

function deriveTrustFromTrace(trace = {}, fallbackGraph = {}) {
  const graph = {};

  (trace.agents || []).forEach(agentTrace => {
    const communication = agentTrace.communicationTrace;
    if (!communication?.sourceId || !communication?.receiverId) return;
    const trust = normalizeTrust(communication.trust);
    graph[communication.sourceId] = graph[communication.sourceId] || {};
    graph[communication.sourceId][communication.receiverId] = trust;
  });

  Object.entries(fallbackGraph || {}).forEach(([sourceId, targets]) => {
    graph[sourceId] = graph[sourceId] || {};
    Object.entries(targets || {}).forEach(([targetId, trust]) => {
      graph[sourceId][targetId] = normalizeTrust(trust);
    });
  });

  return graph;
}

function buildTrustExchangeGraph(events = []) {
  const edges = {};
  events.forEach(event => {
    const source = event.giver;
    const target = event.receiver;
    if (!source || !target) return;
    const key = `${source}->${target}`;
    const previous = edges[key] || {
      source,
      target,
      interactions: 0,
      trustTotal: 0,
      trustAverage: 0
    };
    previous.interactions += 1;
    previous.trustTotal += event.trustLevel || 0;
    previous.trustAverage = clamp01(previous.trustTotal / previous.interactions);
    edges[key] = previous;
  });

  return Object.values(edges);
}

module.exports = {
  buildTrustExchangeGraph,
  deriveTrustFromTrace,
  getTrustLevel
};
