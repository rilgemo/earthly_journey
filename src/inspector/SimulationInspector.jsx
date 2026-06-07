import React from 'react';
import AgentPanel from './panels/AgentPanel';
import AgentTypologyPanel from './panels/AgentTypologyPanel';
import DecisionPanel from './panels/DecisionPanel';
import FieldDynamicsPanel from './panels/FieldDynamicsPanel';
import CoupledEmergencePanel from './panels/CoupledEmergencePanel';
import IntentDebugPanel from './panels/IntentDebugPanel';
import StabilityPanel from './panels/StabilityPanel';
import ScenarioSummaryPanel from './panels/ScenarioSummaryPanel';
import ActionPanel from './panels/ActionPanel';
import ActionYieldPanel from './panels/ActionYieldPanel';
import SkillPanel from './panels/SkillPanel';
import PerceptionDriftPanel from './panels/PerceptionDriftPanel';
import BehaviorPanel from './panels/BehaviorPanel';
import DemandPanel from './panels/DemandPanel';
import SettlementPanel from './panels/SettlementPanel';
import ResourceGeographyPanel from './panels/ResourceGeographyPanel';
import ResourceFlowPanel from './panels/ResourceFlowPanel';
import MigrationPressurePanel from './panels/MigrationPressurePanel';
import ProtoEconomyPanel from './panels/ProtoEconomyPanel';
import SemanticConsistencyPanel from './panels/SemanticConsistencyPanel';
import ReplayPanel from './panels/ReplayPanel';
import TickPanel from './panels/TickPanel';
import TracePanel from './panels/TracePanel';
import WorldPanel from './panels/WorldPanel';

export default function SimulationInspector({ world, trace, replay, semanticReport }) {
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
        <AgentTypologyPanel trace={trace} world={world} />
        <DecisionPanel world={world} />
        <IntentDebugPanel trace={trace} world={world} />
        <FieldDynamicsPanel world={world} />
        <CoupledEmergencePanel world={world} />
        <StabilityPanel world={world} />
        <ScenarioSummaryPanel world={world} />
        <ActionPanel trace={trace} />
        <ActionYieldPanel trace={trace} />
        <SkillPanel world={world} />
        <PerceptionDriftPanel world={world} />
        <BehaviorPanel world={world} />
        <DemandPanel world={world} />
        <ResourceGeographyPanel world={world} />
        <ResourceFlowPanel world={world} />
        <MigrationPressurePanel trace={trace} world={world} />
        <ProtoEconomyPanel trace={trace} world={world} />
        <SettlementPanel world={world} />
        <SemanticConsistencyPanel report={semanticReport} />
      </div>
    </section>
  );
}
