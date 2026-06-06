import React from 'react';

function formatFields(field = {}) {
  return Object.entries(field)
    .map(([key, value]) => `${key}:${value.toFixed(2)}`)
    .join(', ');
}

function FieldStateList({ title, states }) {
  return (
    <div style={{ marginTop: 8 }}>
      <strong>{title}</strong>
      {Object.entries(states || {}).map(([tileId, field]) => (
        <div key={tileId} style={{ marginTop: 4 }}>
          <div>{tileId}</div>
          <div style={{ color: '#8f8a9f' }}>{formatFields(field)}</div>
        </div>
      ))}
    </div>
  );
}

export default function FieldDynamicsPanel({ world }) {
  const dynamics = world?.fieldDynamics;
  if (!dynamics) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Field Dynamics</h3>
      <FieldStateList title="Pre-diffusion" states={dynamics.preDiffusionState} />
      <FieldStateList title="Post-diffusion" states={dynamics.postDiffusionState} />
      <FieldStateList title="Equilibrium delta" states={dynamics.equilibriumDelta} />
      <FieldStateList title="Final state" states={dynamics.finalFieldState} />

      <div style={{ marginTop: 8 }}>
        <strong>Conversion events ({dynamics.conversionEvents?.length ?? 0})</strong>
        {(dynamics.conversionEvents || []).map((event, index) => (
          <div key={`${event.tileId}-${event.from}-${event.to}-${index}`}>
            {event.tileId}: {event.from} -&gt; {event.to} +{event.amount.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
