import React from 'react';

export default function AgentPanel({ world }) {
  if (!world?.agents) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Agents</h3>

      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {world.agents.map((agent) => (
          <div key={agent.id} style={{ marginBottom: 8 }}>
            <div>{agent.name || agent.id}</div>
            <div>Location: {agent.location || 'unknown'}</div>
            <div>
              Mana: {(agent.mana ?? 0).toFixed(2)}
              {agent.manaCapacity ? ` / ${agent.manaCapacity}` : ''}
            </div>
            <div>State: {agent.state || 'active'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
