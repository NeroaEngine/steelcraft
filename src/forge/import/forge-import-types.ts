export type ForgeImportKind = 'contacts' | 'accounts' | 'project-delivery' | 'erection-schedule';

export type ForgeImportSource = {
  type: 'xlsx' | 'csv' | 'monday-board';
  fileName?: string;
  boardId?: string;
  uploadedBy?: string;
};

export type ForgeImportFieldMap = Record<string, string>;

export type ForgeImportRequest = {
  id: string;
  kind: ForgeImportKind;
  source: ForgeImportSource;
  rows: Record<string, unknown>[];
  fieldMap?: ForgeImportFieldMap;
  dryRun?: boolean;
  tenantId?: string;
  userId?: string;
};

export type ForgeImportMappedRow = {
  rowIndex: number;
  source: Record<string, unknown>;
  mapped: Record<string, unknown>;
  errors: string[];
};

export type ForgeImportReceipt = {
  id: string;
  kind: ForgeImportKind;
  source: ForgeImportSource;
  status: 'previewed' | 'imported' | 'failed';
  targetTable: string;
  relatedTables: string[];
  rowsRead: number;
  rowsAccepted: number;
  rowsSkipped: number;
  errors: string[];
  dryRun: boolean;
  createdAt: string;
};

export type ForgeImportResult = {
  ok: boolean;
  mappedRows: ForgeImportMappedRow[];
  receipt: ForgeImportReceipt;
};
