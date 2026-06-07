import React from 'react';
import { ACTION_PROFILES } from '../../simulation/actions/actionProfiles';

function summarizeActions(trace = []) {
  const byAgent = {};
  const actions = [];

  trace.forEach(tickTrace => {
    (tickTrace.agents || []).forEach(agentTrace => {
      if (!agentTrace.actionSelected) return;
      const agentId = agentTrace.agentId || 'unknown';
      if (!byAgent[agentId]) byAgent[agentId] = {};
      byAgent[agentId][agentTrace.actionSelected] = (byAgent[agentId][agentTrace.actionSelected] || 0) + 1;
      actions.push(agentTrace.actionSelected);
    });
  });

  const arcaneUsage = actions.filter(action => ACTION_PROFILES[action]?.category === 'magic').length;
  const combat = actions.filter(action => ACTION_PROFILES[action]?.category === 'combat').length;

  return {
    byAgent,
    actions: [...new Set(actions)],
    arcaneUsage,
    combat,
    nonCombat: actions.length - combat
  };
}

function formatFields(fields = {}) {
  return Object.entries(fields)
    .filter(([, value]) => value !== 0)
    .map(([field, value]) => `${field} ${value > 0 ? '+' : ''}${value}`)
    .join(', ') || 'none';
}

export default function ActionPanel({ trace }) {
  const summary = summarizeActions(trace);
  const total = summary.combat + summary.nonCombat;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Actions</h3>
      <div>Arcane usage: {summary.arcaneUsage}</div>
      <div>
        Combat ratio: {total ? (summary.combat / total).toFixed(3) : '0.000'}
        {' '}({summary.combat} / {summary.nonCombat})
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>By agent</strong>
        {Object.entries(summary.byAgent).map(([agentId, actions]) => (
          <div key={agentId}>{agentId}: {Object.entries(actions).map(([action, count]) => `${action} ${count}`).join(', ')}</div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Field impact</strong>
        {summary.actions.map(action => (
          <div key={action}>{action}: {formatFields(ACTION_PROFILES[action]?.fieldAffinity)}</div>
        ))}
      </div>
    </div>
  );
}
