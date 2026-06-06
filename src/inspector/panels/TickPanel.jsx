import React from 'react';

function getTickId(tickTrace) {
  return tickTrace.tick ?? tickTrace.tickId ?? 0;
}

export default function TickPanel({ trace }) {
  const ticks = trace || [];

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Ticks</h3>

      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {ticks.map((tickTrace, index) => (
          <div key={`${getTickId(tickTrace)}-${index}`}>
            Tick #{getTickId(tickTrace)}
          </div>
        ))}
      </div>
    </div>
  );
}
