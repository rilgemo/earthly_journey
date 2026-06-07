import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function latestExchangeSnapshot(trace = [], world = {}) {
  return trace.slice().reverse().find(tick => tick.exchangeSnapshot)?.exchangeSnapshot
    || world?.exchangeSnapshot
    || null;
}

function compactResources(resources = {}) {
  return Object.entries(resources)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${key} ${format(value)}`)
    .join(', ') || 'none';
}

export default function ProtoEconomyPanel({ trace, world }) {
  const snapshot = latestExchangeSnapshot(trace, world);
  if (!snapshot) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Resource Exchange</h3>
      <div>Events: {snapshot.eventCount || 0}</div>
      <div>Trust Edges: {snapshot.trustGraph?.length || 0}</div>
      <div>Reciprocity Chains: {snapshot.reciprocityChains?.length || 0}</div>
      <div style={{ maxHeight: 360, overflow: 'auto', marginTop: 8 }}>
        {(snapshot.events || []).map(event => (
          <div key={event.eventId} style={{ marginBottom: 10 }}>
            <strong>
              {event.participants?.giver} -&gt; {event.participants?.receiver}
            </strong>
            <div>Mode: {event.mode}</div>
            <div>Score: {format(event.interactionScore)}</div>
            <div>Driver: {event.dominantDriver}</div>
            <div>Trust: {format(event.trustContribution)}</div>
            <div>Out: {compactResources(event.resourceFlow?.out)}</div>
            <div>In: {compactResources(event.resourceFlow?.in)}</div>
            <div>Reciprocity: {event.reciprocityLink?.type || 'open'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
