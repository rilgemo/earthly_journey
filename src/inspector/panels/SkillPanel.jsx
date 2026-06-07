import React from 'react';

function topSkills(skills = {}) {
  return Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
}

export default function SkillPanel({ world }) {
  if (!world?.agents) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Skills</h3>
      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {world.agents.map(agent => (
          <div key={agent.id} style={{ marginBottom: 8 }}>
            <strong>{agent.name || agent.id}</strong>
            <div>
              Top: {topSkills(agent.skills).map(([skill, value]) => `${skill} ${value.toFixed(2)}`).join(', ') || 'none'}
            </div>
            <div>
              Growth: {(agent.skillGain || []).map(gain => `${gain.skill} +${gain.gain.toFixed(3)}`).join(', ') || 'none'}
            </div>
            <div>Knowledge: {agent.knowledgeCount || 0}</div>
            <div>Identity: {(agent.identities || []).join(', ') || 'unformed'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
