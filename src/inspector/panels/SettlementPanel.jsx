import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function SettlementPanel({ world }) {
  const snapshot = world?.settlements;
  if (!snapshot) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Activity Clusters</h3>
      <div>Detected: {snapshot.settlements?.length || 0}</div>
      <div style={{ maxHeight: 360, overflow: 'auto', marginTop: 8 }}>
        {(snapshot.settlements || []).map(settlement => (
          <div key={settlement.id} style={{ marginBottom: 10 }}>
            <strong>{settlement.centerPoint?.tileId || settlement.id}</strong>
            <div>Radius: {format(settlement.radius)}</div>
            <div>Density: {format(settlement.densityScore)}</div>
            <div>Persistence: {format(settlement.persistenceScore)}</div>
            <div>Trend: {settlement.trend || 'stable'} ({format(settlement.growthRate)})</div>
            <div>
              Activities: {settlement.dominantActivities
                ?.map(activity => `${activity.action} ${activity.count}`)
                .join(', ') || 'none'}
            </div>
            <div>
              Heat: {Object.entries(settlement.activityHeat || {})
                .map(([tileId, heat]) => `${tileId} ${format(heat)}`)
                .join(', ') || 'none'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
