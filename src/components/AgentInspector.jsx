import React from 'react';

export default function AgentInspector({ agent }) {
  if (!agent) return <div>No agent selected</div>;
  return (
    <div style={{padding:10,border:'1px solid #eee'}}>
      <h4>{agent.agentId}</h4>
      <div>Action: {agent.actionSelected}</div>
      <h5>Score Breakdown</h5>
      <pre style={{fontSize:12}}>{JSON.stringify(agent.scoreBreakdown, null, 2)}</pre>
      <h5>Mana</h5>
      <pre style={{fontSize:12}}>{JSON.stringify({ before: agent.manaBefore, after: agent.manaAfter }, null, 2)}</pre>
      <div>Position: {agent.position}</div>
    </div>
  );
}
