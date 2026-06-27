export type ProjectStage =
  | 'lead'
  | 'qualified'
  | 'estimating'
  | 'proposal-sent'
  | 'follow-up'
  | 'negotiation'
  | 'awarded'
  | 'contract-executed'
  | 'production-hold'
  | 'approval-drawings'
  | 'release-for-production'
  | 'fabrication'
  | 'delivery-scheduled'
  | 'erection-scheduled'
  | 'substantial-completion'
  | 'closeout';

export type MasterProjectRecord = {
  id: string;
  projectNumber: string;
  name: string;
  stage: ProjectStage;
  customerId?: string;
  accountId?: string;
  estimator?: string;
  salesperson?: string;
  projectManager?: string;
  manufacturerJobNumber?: string;
  customerPoNumber?: string;
  contractNumber?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectActivityEvent = {
  id: string;
  projectId: string;
  type: string;
  title: string;
  body?: string;
  userId?: string;
  createdAt: string;
  receiptId?: string;
};
