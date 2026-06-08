import React from 'react';

function format(value) {
  return typeof value === 'number' ? value.toFixed(3) : '0.000';
}

export default function CivilizationMythPanel({ world = {}, mythReport }) {
  const result = mythReport || world?.civilizationMythReport || world?.mythReport || null;
  const myth = result?.myth || world?.civilizationMyth || world?.myth || null;
  const mythTrace = result?.mythTrace || world?.civilizationMythTrace || world?.mythTrace || null;

  if (!myth || !mythTrace?.symbolicNodes?.length) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Civilization Myth</h3>
      <div>Myth: {myth.mythId}</div>
      <div>Stability: {format(mythTrace.stabilityIndex)}</div>
      <div>Moral: {myth.moralFraming}</div>
      <div style={{ maxHeight: 180, overflow: 'auto', marginTop: 8 }}>
        {(mythTrace.narrativeClusters || []).map(statement => (
          <div key={statement.statementId}>{statement.text}</div>
        ))}
      </div>
      <div>
        Symbols: {(mythTrace.symbolicNodes || []).map(node => node.symbolicEntity).join(', ') || 'none'}
      </div>
      <div>
        Contradictions: {(mythTrace.contradictionMap || []).length}
      </div>
    </div>
  );
}
