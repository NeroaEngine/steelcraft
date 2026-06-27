export type WorkAreaId =
  | 'command-center'
  | 'crm-sales'
  | 'estimating'
  | 'proposal'
  | 'contract'
  | 'schedule-of-values'
  | 'billing-insurance'
  | 'project-delivery'
  | 'erection'
  | 'vendor-portal'
  | 'customer-portal'
  | 'documents'
  | 'change-orders'
  | 'activity-timeline'
  | 'import-center';

export type WorkAreaStatus = 'idle' | 'loading' | 'active' | 'suspended' | 'error';

export type WorkAreaManifest = {
  id: WorkAreaId;
  title: string;
  description: string;
  cardIds: string[];
  requiredTables?: string[];
  allowedRoles?: string[];
  protected?: boolean;
};

export type WorkAreaContext = {
  workAreaId: WorkAreaId;
  projectId?: string;
  userId?: string;
  role?: string;
};

export type WorkAreaRuntimeState = {
  status: WorkAreaStatus;
  manifest?: WorkAreaManifest;
  cards: unknown[];
  errors: string[];
};
