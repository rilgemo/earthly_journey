// Layer 2 Phase 2.0 — deterministic trace_log -> human-readable debug text.
// Reads trace_log only. No belief_state, no simulation/, no speculation.

const templates = require('./templates.json');

function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
  });
}

function findAgentIdForCommitment(trace_log, commitment_id) {
  const created = trace_log.find(
    e => e.event_type === 'COMMITMENT_CREATED' && e.commitment_id === commitment_id
  );
  return created ? created.agent_id : null;
}

function explainEvent(event, trace_log) {
  const template = templates[event.event_type];
  if (!template) {
    return 'UNKNOWN_EVENT: ' + JSON.stringify(event);
  }

  if (event.event_type === 'COMMITMENT_BROKEN') {
    const agent_id = findAgentIdForCommitment(trace_log, event.commitment_id);
    const subject = agent_id !== null ? agent_id : `commitment ${event.commitment_id}`;
    return fillTemplate(template, { ...event, agent_id: subject });
  }

  return fillTemplate(template, event);
}

function traceExplain(trace_log) {
  for (const event of trace_log) {
    console.log(explainEvent(event, trace_log));
  }
}

module.exports = { traceExplain };
