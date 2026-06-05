import React, { useState } from 'react';
import TickPanel from './TickPanel';
import AgentInspector from './AgentInspector';
import FieldViewer from './FieldViewer';

export default function Inspector({ trace }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  if (!trace) return <div>No trace loaded</div>;
  return (
    <div style={{display:'flex',gap:10}}>
      <div style={{width:240}}>
        <h3>Tick #{trace.tickId}</h3>
        <div>
          <ul>
            {trace.agents.map(a=> (
              <li key={a.agentId} onClick={()=>setSelectedAgent(a.agentId)} style={{cursor:'pointer'}}>
                {a.agentId} - {a.actionSelected}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{flex:1}}>
        <TickPanel trace={trace} />
        <FieldViewer field={trace.worldSnapshot['meadow'] ? trace.worldSnapshot['meadow'].field : {}} />
      </div>
      <div style={{width:360}}>
        <AgentInspector agent={trace.agents.find(x=>x.agentId===selectedAgent) || trace.agents[0]} />
      </div>
    </div>
  );
}
