import type { WorkAreaId } from './workarea-contract';

export type CardStatus = 'ready' | 'loading' | 'blocked' | 'error';

export type CardKind =
  | 'project'
  | 'crm'
  | 'estimate'
  | 'proposal'
  | 'contract'
  | 'schedule-of-values'
  | 'billing'
  | 'delivery'
  | 'erection'
  | 'document'
  | 'change-order'
  | 'vendor'
  | 'customer'
  | 'activity'
  | 'import';

export type SteelCraftCard = {
  id: string;
  kind: CardKind;
  title: string;
  description: string;
  workAreaId: WorkAreaId;
  route?: string;
  sqlTable?: string;
  status?: CardStatus;
  protected?: boolean;
};

export type CardRuntimeState = SteelCraftCard & {
  data?: unknown;
  errors?: string[];
};
