export enum AgentType {
  COORDINATOR = 'Koordinator_Sistem_Rumah_Sakit',
  PATIENT_MGMT = 'PatientManagement',
  SCHEDULER = 'AppointmentScheduler',
  RECORDS = 'MedicalRecords',
  BILLING = 'BillingAndPayments',
  USER = 'User'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  agent?: AgentType; // The agent answering the request
  timestamp: Date;
  isThinking?: boolean;
}

export interface ToolCallDetails {
  functionName: string;
  args: Record<string, any>;
}

export type AgentStatus = 'idle' | 'active' | 'success' | 'error';
