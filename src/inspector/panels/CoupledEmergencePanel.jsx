import React from 'react';

function ProposalList({ title, proposals = [] }) {
  return (
    <div style={{ marginTop: 8 }}>
      <strong>{title} ({proposals.length})</strong>
      {proposals.map((proposal, index) => (
        <div key={`${proposal.source}-${proposal.tileId}-${index}`} style={{ marginTop: 4 }}>
          {proposal.tileId}: {Object.entries(proposal.fields || {})
            .filter(([, value]) => value !== 0)
            .map(([field, value]) => `${field} ${value >= 0 ? '+' : ''}${value.toFixed(3)}`)
            .join(', ')}
        </div>
      ))}
    </div>
  );
}

export default function CoupledEmergencePanel({ world }) {
  const emergence = world?.coupledEmergence;
  if (!emergence) return null;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Coupled Emergence</h3>
      <div>Queued for next field tick: {emergence.finalPerturbationQueue?.length ?? 0}</div>
      <ProposalList title="Activity coupling" proposals={emergence.activityCouplingLog} />
      <ProposalList title="Social coupling" proposals={emergence.socialCouplingLog} />
      <ProposalList title="Memory imprint" proposals={emergence.memoryImprintLog} />
      <ProposalList title="Final perturbation queue" proposals={emergence.finalPerturbationQueue} />
    </div>
  );
}
