import React from 'react';

function formatBreakdown(breakdown = {}) {
  return Object.entries(breakdown)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => `${key}:${value.toFixed(1)}`)
    .join(', ');
}

export default function DecisionPanel({ world }) {
  const decisions = (world?.agents || [])
    .filter(agent => agent.decisionTrace)
    .map(agent => ({ agent, trace: agent.decisionTrace }));

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Decisions</h3>

      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {decisions.map(({ agent, trace }) => (
          <div
            key={agent.id}
            style={{ borderBottom: '1px solid #2a2a35', marginBottom: 8, paddingBottom: 8 }}
          >
            <div>{agent.name || agent.id}</div>
            <div>Selected: {trace.selected || 'none'}</div>
            <div>Final: {trace.resolutionResult?.finalScore?.toFixed(2) ?? 'n/a'}</div>

            {(trace.candidates || [])
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((candidate, index) => (
                <div key={candidate.intent} style={{ marginTop: 4 }}>
                  <div>#{index + 1} {candidate.intent}: {candidate.score.toFixed(2)}</div>
                  <div style={{ color: '#8f8a9f' }}>
                    {formatBreakdown(trace.breakdown?.[candidate.intent])}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
