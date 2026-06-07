import React from 'react';

function list(items = []) {
  return items.length ? items.join(', ') : 'none';
}

export default function SemanticConsistencyPanel({ report }) {
  if (!report) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Semantic Consistency</h3>
      <div>Drift Score: {report.driftScore}</div>
      <div>Total Terms: {report.totalTerms}</div>
      <div>Mapped Terms: {report.mappedTerms}</div>
      <div>Orphan Runtime: {list(report.orphanRuntimeTerms)}</div>
      <div>Orphan Narrative: {list(report.orphanNarrativeTerms)}</div>

      <div style={{ marginTop: 8 }}>
        <strong>Mappings</strong>
        <div style={{ maxHeight: 180, overflow: 'auto' }}>
          {(report.mappingGraph || []).map(entry => (
            <div key={entry.runtimeTerm}>
              {entry.runtimeTerm} -&gt; {entry.narrativeTerms.join(', ')}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Inconsistencies</strong>
        <div style={{ maxHeight: 180, overflow: 'auto' }}>
          {(report.inconsistencies || []).map((item, index) => (
            <div key={`${item.type}-${item.term}-${index}`}>
              [{item.type}] {item.term}: {item.message}
            </div>
          ))}
          {(!report.inconsistencies || report.inconsistencies.length === 0) && (
            <div>none</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Evolution History</strong>
        <div>Report timestamp: {report.timestamp}</div>
        <div>Stability source: semantic registry</div>
      </div>
    </div>
  );
}
