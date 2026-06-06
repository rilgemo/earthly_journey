import React from 'react';

function getTickId(tickTrace) {
  return tickTrace.tick ?? tickTrace.tickId ?? 0;
}

function getAgentRows(trace) {
  return (trace || []).flatMap((tickTrace) => {
    const tick = getTickId(tickTrace);
    const agents = tickTrace.agents || [];

    if (!agents.length) {
      return [{
        id: `${tick}-trace`,
        tick,
        agentId: tickTrace.agentId || 'world',
        action: tickTrace.action || tickTrace.actionSelected || null,
        actionRejected: Boolean(tickTrace.actionRejected),
        rejectionReason: tickTrace.rejectionReason
      }];
    }

    return agents.map((agentTrace, index) => ({
      id: `${tick}-${agentTrace.agentId || index}`,
      tick,
      agentId: agentTrace.agentId,
      action: agentTrace.actionSelected,
      actionRejected: Boolean(agentTrace.actionRejected),
      rejectionReason: agentTrace.rejectionReason
    }));
  });
}

export default function TracePanel({ trace }) {
  const rows = getAgentRows(trace).slice(-80).reverse();

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Trace</h3>

      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              borderBottom: '1px solid #2a2a35',
              marginBottom: 6,
              paddingBottom: 6
            }}
          >
            <div>Tick: {row.tick}</div>
            <div>Agent: {row.agentId || 'unknown'}</div>
            <div>Action: {row.action || 'none'}</div>
            <div>Status: {row.actionRejected ? 'REJECTED' : 'OK'}</div>

            {row.rejectionReason && (
              <div style={{ color: '#c05050' }}>
                Reason: {row.rejectionReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
