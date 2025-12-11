import React from 'react';
import { AgentType } from '../types';
import { Network, Users, Calendar, FileText, CreditCard } from 'lucide-react';

interface AgentVisualizerProps {
  activeAgent: AgentType | null;
}

const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ activeAgent }) => {
  
  const getAgentColor = (type: AgentType) => {
    const isActive = activeAgent === type;
    const isCoordinator = type === AgentType.COORDINATOR;
    
    // Base styles
    let base = "flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 transition-all duration-500 ease-in-out shadow-lg z-10 bg-white ";
    
    if (isActive) {
      return base + "border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-200 scale-110 shadow-blue-200";
    } else if (activeAgent && !isActive && !isCoordinator) {
      // Dim others when one is active
      return base + "border-slate-200 text-slate-300 scale-95 opacity-60";
    } else {
      // Default state
      return base + "border-slate-300 text-slate-600 hover:border-blue-300";
    }
  };

  const Connector = ({ active, rotation }: { active: boolean, rotation: string }) => (
    <div 
      className={`absolute top-1/2 left-1/2 w-32 h-1 origin-left -z-0 transition-colors duration-300 ${active ? 'bg-blue-400' : 'bg-slate-200'}`}
      style={{ transform: `translateY(-50%) rotate(${rotation})` }}
    />
  );

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center bg-slate-50 overflow-hidden rounded-xl border border-slate-200 my-4">
      {/* Central Coordinator */}
      <div className="absolute z-20">
        <div className={getAgentColor(AgentType.COORDINATOR)}>
          <Network className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-bold text-center leading-tight">COORDINATOR</span>
        </div>
      </div>

      {/* Connectors */}
      <Connector active={activeAgent === AgentType.PATIENT_MGMT} rotation="225deg" />
      <Connector active={activeAgent === AgentType.SCHEDULER} rotation="315deg" />
      <Connector active={activeAgent === AgentType.RECORDS} rotation="135deg" />
      <Connector active={activeAgent === AgentType.BILLING} rotation="45deg" />

      {/* Satellites */}
      
      {/* Top Left: Patient Mgmt */}
      <div className="absolute top-10 left-10 md:top-16 md:left-24">
        <div className={getAgentColor(AgentType.PATIENT_MGMT)}>
          <Users className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-medium text-center leading-tight">Patient<br/>Mgmt</span>
        </div>
      </div>

      {/* Top Right: Scheduler */}
      <div className="absolute top-10 right-10 md:top-16 md:right-24">
        <div className={getAgentColor(AgentType.SCHEDULER)}>
          <Calendar className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-medium text-center leading-tight">Scheduler</span>
        </div>
      </div>

      {/* Bottom Left: Records */}
      <div className="absolute bottom-10 left-10 md:bottom-16 md:left-24">
        <div className={getAgentColor(AgentType.RECORDS)}>
          <FileText className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-medium text-center leading-tight">Medical<br/>Records</span>
        </div>
      </div>

      {/* Bottom Right: Billing */}
      <div className="absolute bottom-10 right-10 md:bottom-16 md:right-24">
        <div className={getAgentColor(AgentType.BILLING)}>
          <CreditCard className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-medium text-center leading-tight">Billing</span>
        </div>
      </div>

      {/* Status Label */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
         <span className={`text-sm px-3 py-1 rounded-full ${activeAgent ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
            {activeAgent ? `Agent Active: ${activeAgent}` : 'System Idle'}
         </span>
      </div>
    </div>
  );
};

export default AgentVisualizer;