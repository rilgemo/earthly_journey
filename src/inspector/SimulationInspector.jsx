import React from 'react';
import AgentPanel from './panels/AgentPanel';
import DecisionPanel from './panels/DecisionPanel';
import FieldDynamicsPanel from './panels/FieldDynamicsPanel';
import CoupledEmergencePanel from './panels/CoupledEmergencePanel';
import StabilityPanel from './panels/StabilityPanel';
import ScenarioSummaryPanel from './panels/ScenarioSummaryPanel';
import ReplayPanel from './panels/ReplayPanel';
import TickPanel from './panels/TickPanel';
import TracePanel from './panels/TracePanel';
import WorldPanel from './panels/WorldPanel';

export default function SimulationInspector({ world, trace, replay }) {
  return (
    <section
      style={{
        borderTop: '1px solid #2a2a35',
        background: '#101014',
        color: '#d4d0c8',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: 12
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        <ReplayPanel
          currentFrame={replay?.currentFrame}
          frameCount={replay?.frameCount ?? 0}
          isLive={replay?.isLive ?? true}
          onPrev={replay?.onPrev}
          onNext={replay?.onNext}
          onLive={replay?.onLive}
        />
        <TickPanel trace={trace} />
        <WorldPanel world={world} />
        <TracePanel trace={trace} />
        <AgentPanel world={world} />
        <DecisionPanel world={world} />
        <FieldDynamicsPanel world={world} />
        <CoupledEmergencePanel world={world} />
        <StabilityPanel world={world} />
        <ScenarioSummaryPanel world={world} />
      </div>
    </section>
  );
}
