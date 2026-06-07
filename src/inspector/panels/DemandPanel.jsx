import React from 'react';

const DEMANDS = ['food', 'tools', 'materials', 'healing', 'arcane', 'safety', 'shelter'];

function format(value) {
  return typeof value === 'number' ? value.toFixed(2) : '0.00';
}

export default function DemandPanel({ world }) {
  const demand = world?.demand;
  if (!demand) return null;
  const history = world.demandHistory || [];
  const recent = history.slice(-5);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>World Demand</h3>
      {DEMANDS.map(type => (
        <div key={type}>{type}: {format(demand[type])}</div>
      ))}
      <div style={{ marginTop: 8 }}>Dominant: {demand.dominantDemand || 'none'}</div>
      <div>Entropy: {format(demand.demandEntropy)}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Recent trend</strong>
        {DEMANDS.map(type => (
          <div key={type}>
            {type}: {recent.map(entry => format(entry[type])).join(' -> ') || 'none'}
          </div>
        ))}
      </div>
    </div>
  );
}
