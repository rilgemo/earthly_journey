import React from 'react';

function GainGroup({ title, gains = {} }) {
  return (
    <div style={{ marginTop: 8 }}>
      <strong>{title}</strong>
      {Object.entries(gains).map(([name, value]) => (
        <div key={name}>{name}: {value.toFixed(3)}</div>
      ))}
    </div>
  );
}

export default function StabilityPanel({ world }) {
  const stability = world?.stability;
  if (!stability) return null;

  const { metrics = {}, adjustedGains = {} } = stability;
  const history = (world?.stabilityHistory || []).slice(-5).reverse();

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Stability</h3>
      <div>System score: {(metrics.globalSystemStabilityScore ?? 0).toFixed(3)}</div>
      <div>Field instability: {(metrics.fieldInstabilityIndex ?? 0).toFixed(3)}</div>
      <div>Social instability: {(metrics.socialInstabilityIndex ?? 0).toFixed(3)}</div>
      <div>Emergence instability: {(metrics.emergenceInstabilityIndex ?? 0).toFixed(3)}</div>
      <GainGroup title="Field gains" gains={adjustedGains.field} />
      <GainGroup title="Social gains" gains={adjustedGains.social} />
      <GainGroup title="Emergence gains" gains={adjustedGains.emergence} />
      <div style={{ marginTop: 8 }}>
        <strong>Recent adjustments</strong>
        {history.map(entry => (
          <div key={entry.tick}>
            Tick {entry.tick}: score {(entry.metrics.globalSystemStabilityScore ?? 0).toFixed(3)},
            field gain {(entry.adjustedGains.field.diffusionGain ?? 0).toFixed(3)},
            emergence gain {(entry.adjustedGains.emergence.emergenceCouplingGain ?? 0).toFixed(3)}
          </div>
        ))}
      </div>
    </div>
  );
}
