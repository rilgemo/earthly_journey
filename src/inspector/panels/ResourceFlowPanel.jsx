import React from 'react';

const RESOURCES = ['foodPotential', 'waterPotential', 'materialPotential', 'arcanePotential'];

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function heatEntries(map = {}) {
  return Object.entries(map)
    .slice(0, 5)
    .map(([tileId, values]) => `${tileId}: ${Object.entries(values)
      .filter(([, value]) => value !== 0)
      .map(([resource, value]) => `${resource} ${format(value)}`)
      .join(', ') || 'none'}`);
}

export default function ResourceFlowPanel({ world }) {
  const flow = world?.resourceFlow;
  if (!flow) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Resource Flow</h3>
      <div>Stability: {format(flow.balance?.stabilityRatio)}</div>
      <div>Total delta: {format(flow.balance?.totalDelta)}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Gain / loss</strong>
        {RESOURCES.map(resource => (
          <div key={resource}>{resource}: {format(flow.balance?.delta?.[resource])}</div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Depletion</strong>
        {heatEntries(flow.depletionHeatmap).map(entry => <div key={entry}>{entry}</div>)}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Regeneration</strong>
        {heatEntries(flow.regenerationMap).map(entry => <div key={entry}>{entry}</div>)}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Diffusion</strong>
        {(flow.diffusionVectors || []).slice(0, 6).map((vector, index) => (
          <div key={`${vector.from}-${vector.to}-${vector.resourceType}-${index}`}>
            {vector.resourceType}: {vector.from} -&gt; {vector.to} {format(vector.amount)}
          </div>
        ))}
      </div>
    </div>
  );
}
