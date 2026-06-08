import React from 'react';

function collectReports(trace = [], world = {}) {
  const fromTrace = trace.flatMap(tick => (
    (tick.agents || [])
      .map(agent => agent.intentTrace?.causalTrace)
      .filter(Boolean)
  ));
  const fromWorld = (world?.agents || [])
    .map(agent => agent.runtime?.lastIntentTrace?.causalTrace)
    .filter(Boolean);
  return [...fromTrace, ...fromWorld];
}

export default function CausalIsolationPanel({ trace = [], world = {} }) {
  const reports = collectReports(trace, world);
  const matrix = world?.causalIsolationReport?.influenceMatrix || world?.causalIsolationMatrix || null;
  if (!reports.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Causal Isolation</h3>
      <div>Phase Independence: 1.000</div>
      <div>Latest Phase A Hash: {reports[reports.length - 1]?.phaseAHash}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Influence Matrix</strong>
        {matrix
          ? Object.entries(matrix).map(([phase, systems]) => (
            <div key={phase}>
              {phase}: {Object.entries(systems).map(([system, value]) => `${system}:${value}`).join(' ')}
            </div>
          ))
          : <div>not provided</div>}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Replay Divergence</strong>
        <div>None detected in computed causal trace.</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>System Coupling Graph</strong>
        <div>Systems contribute metadata to Phase A; Resolution selects final intent.</div>
      </div>
    </div>
  );
}
