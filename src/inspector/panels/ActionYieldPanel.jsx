import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

function collectYields(trace = []) {
  return trace.flatMap(tickTrace => (tickTrace.agents || [])
    .map(agent => agent.actionYieldSnapshot)
    .filter(Boolean));
}

function summarizeByAction(yields) {
  return yields.reduce((result, snapshot) => {
    const key = snapshot.actionId;
    if (!result[key]) result[key] = { count: 0, total: 0 };
    result[key].count += 1;
    result[key].total += snapshot.totalYield || 0;
    return result;
  }, {});
}

export default function ActionYieldPanel({ trace }) {
  const yields = collectYields(trace);
  if (!yields.length) return null;
  const byAction = summarizeByAction(yields);
  const ranked = yields
    .slice()
    .sort((first, second) => (second.totalYield || 0) - (first.totalYield || 0));

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Action Yield</h3>
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        <strong>By action</strong>
        {Object.entries(byAction).map(([actionId, summary]) => (
          <div key={actionId}>
            {actionId}: avg {format(summary.total / summary.count)} ({summary.count})
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <strong>Best tiles</strong>
          {ranked.slice(0, 5).map((snapshot, index) => (
            <div key={`${snapshot.actionId}-${snapshot.tileContext.tileId}-${index}`}>
              {snapshot.actionId} @ {snapshot.tileContext.tileId}: {format(snapshot.totalYield)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Low yield zones</strong>
          {ranked.slice(-5).map((snapshot, index) => (
            <div key={`low-${snapshot.actionId}-${snapshot.tileContext.tileId}-${index}`}>
              {snapshot.actionId} @ {snapshot.tileContext.tileId}: {format(snapshot.totalYield)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
