import React from 'react';

const RESOURCES = ['foodPotential', 'waterPotential', 'materialPotential', 'arcanePotential'];

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function heatLine(map, resource) {
  return Object.entries(map?.tiles || {})
    .slice(0, 8)
    .map(([tileId, tile]) => `${tileId} ${format((tile[resource] || 0) / 100)}`)
    .join(', ');
}

export default function ResourceGeographyPanel({ world }) {
  const snapshot = world?.resourceGeography;
  if (!snapshot) return null;
  const metrics = snapshot.metrics || {};

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Resource Geography</h3>
      {RESOURCES.map(resource => (
        <div key={resource}>
          {resource}: {heatLine(snapshot.map, resource) || 'none'}
        </div>
      ))}
      <div style={{ marginTop: 8 }}>Richness: {format(metrics.regionalRichness)}</div>
      <div>Diversity: {format(metrics.resourceDiversity)}</div>
      <div>Concentration: {format(metrics.resourceConcentration)}</div>
      <div>Entropy: {format(metrics.resourceEntropy)}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Richest</strong>
        {(metrics.richestRegions || []).map(region => (
          <div key={region.tileId}>{region.tileId}: {format(region.richness)}</div>
        ))}
      </div>
    </div>
  );
}
