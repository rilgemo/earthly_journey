import React from 'react';

export default function TickPanel({ trace }) {
  if (!trace) return null;
  return (
    <div style={{padding:10, border:'1px solid #ddd', marginBottom:8}}>
      <h4>World Fields Snapshot</h4>
      <pre style={{fontSize:12}}>{JSON.stringify(trace.worldSnapshot, null, 2)}</pre>
    </div>
  );
}
