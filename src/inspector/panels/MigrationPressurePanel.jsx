import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function latestMigrationPressure(trace = [], world = {}) {
  return trace.slice().reverse().find(tick => tick.migrationPressureSnapshot)?.migrationPressureSnapshot
    || world?.migrationPressureSnapshot
    || null;
}

export default function MigrationPressurePanel({ trace, world }) {
  const snapshot = latestMigrationPressure(trace, world);
  if (!snapshot) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Distribution Pressure</h3>
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        {(snapshot.regionPressures || []).map(region => (
          <div key={region.regionId} style={{ marginBottom: 10 }}>
            <strong>{region.regionId}</strong>
            <div>Stability: {format(region.stabilityScore)}</div>
            <div>Pressure: {format(region.pressureScore)}</div>
            <div>Risk: {region.riskClassification}</div>
            <div>Dominant: {region.dominantInstabilitySource}</div>
            <div>
              Anchoring: social {format(region.stabilityField?.socialAnchoring)}
              {' '}trust {format(region.stabilityField?.trustDensity)}
            </div>
            <div>
              Env: resource {format(region.breakdown?.resourceInstability)}
              {' '}volatility {format(region.breakdown?.environmentalVolatility)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
