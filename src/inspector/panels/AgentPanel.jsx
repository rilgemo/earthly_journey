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
            {agent.selectedIntent && (
              <div>Selected: {agent.selectedIntent}</div>
            )}
            {agent.needs && (
              <div>
                Needs: H{Math.round(agent.needs.hunger || 0)}
                {' '}F{Math.round(agent.needs.fatigue || 0)}
                {' '}M{Math.round(agent.needs.manaNeed || 0)}
              </div>
            )}
            {agent.memories?.length > 0 && (
              <div>Memories: {agent.memories.length}</div>
            )}
            {agent.intents?.length > 0 && (
              <div>
                Intents: {agent.intents.slice(0, 3).map(intent => (
                  `${intent.intent}:${intent.score.toFixed(1)}`
                )).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
