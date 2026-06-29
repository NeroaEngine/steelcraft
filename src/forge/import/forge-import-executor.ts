import { getImportCardTarget, type ImportTargetCardId } from '../../workareas/registry/import-card-targets';
import type { ForgeImportMappedRow, ForgeImportReceipt, ForgeImportRequest, ForgeImportResult } from './forge-import-types';

const defaultFieldMaps: Record<ImportTargetCardId, Record<string, string[]>> = {
  contacts: {
    name: ['name', 'full name', 'contact', 'contact name', 'person'],
    email: ['email', 'email address', 'e-mail'],
    phone: ['phone', 'phone number', 'mobile', 'cell'],
    company: ['company', 'account', 'organization', 'customer'],
    title: ['title', 'job title', 'role'],
    notes: ['notes', 'comments'],
  },
  accounts: {
    accountName: ['account', 'account name', 'company', 'customer', 'organization'],
    accountType: ['type', 'account type', 'category'],
    address: ['address', 'billing address', 'mailing address'],
    phone: ['phone', 'phone number'],
    website: ['website', 'url'],
    primaryContact: ['primary contact', 'contact'],
    notes: ['notes', 'comments'],
  },
  'project-delivery': {
    projectName: ['project', 'project name', 'job', 'job name'],
    manufacturer: ['manufacturer', 'vendor'],
    mbsJobNumber: ['mbs job #', 'mbs job number', 'manufacturer job number'],
    engineeringStatus: ['engineering status', 'engineering'],
    drawingStage: ['drawing stage', 'drawings', 'approval drawings'],
    productionStatus: ['production status', 'production'],
    deliveryDate: ['delivery date', 'building delivery date'],
    projectManager: ['project manager', 'pm'],
    notes: ['notes', 'comments'],
  },
  'erection-schedule': {
    projectName: ['project', 'project name', 'job', 'job name'],
    deliveryDate: ['delivery date', 'building delivery date'],
    erectionStartDate: ['erection start', 'erection start date', 'start date'],
    crew: ['crew', 'crew assignment', 'subcontractor'],
    superintendent: ['superintendent', 'super'],
    percentComplete: ['percent complete', '% complete', 'complete'],
    status: ['status', 'erection status'],
    notes: ['notes', 'comments'],
  },
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function findSourceKey(row: Record<string, unknown>, candidates: string[]): string | undefined {
  const normalizedEntries = Object.keys(row).map((key) => ({ original: key, normalized: normalizeKey(key) }));
  return normalizedEntries.find((entry) => candidates.some((candidate) => normalizeKey(candidate) === entry.normalized))?.original;
}

function mapRow(kind: ImportTargetCardId, row: Record<string, unknown>, rowIndex: number, explicitMap?: Record<string, string>): ForgeImportMappedRow {
  const target = getImportCardTarget(kind);
  const mapped: Record<string, unknown> = {};
  const errors: string[] = [];
  const defaultMap = defaultFieldMaps[kind];

  const targetFields = [...(target?.requiredFields || []), ...(target?.optionalFields || [])];

  for (const targetField of targetFields) {
    const explicitSourceKey = explicitMap?.[targetField];
    const sourceKey = explicitSourceKey || findSourceKey(row, defaultMap[targetField] || [targetField]);
    if (sourceKey && row[sourceKey] !== undefined && row[sourceKey] !== null && row[sourceKey] !== '') {
      mapped[targetField] = row[sourceKey];
    }
  }

  for (const requiredField of target?.requiredFields || []) {
    if (!mapped[requiredField]) errors.push(`Missing required field: ${requiredField}`);
  }

  return { rowIndex, source: row, mapped, errors };
}

function buildReceipt(request: ForgeImportRequest, mappedRows: ForgeImportMappedRow[], status: ForgeImportReceipt['status']): ForgeImportReceipt {
  const target = getImportCardTarget(request.kind);
  const rowErrors = mappedRows.flatMap((row) => row.errors.map((error) => `Row ${row.rowIndex + 1}: ${error}`));

  return {
    id: `${request.kind}-${Date.now()}`,
    kind: request.kind,
    source: request.source,
    status,
    targetTable: target?.primaryTable || request.kind,
    relatedTables: target?.relatedTables || [],
    rowsRead: mappedRows.length,
    rowsAccepted: mappedRows.filter((row) => row.errors.length === 0).length,
    rowsSkipped: mappedRows.filter((row) => row.errors.length > 0).length,
    errors: rowErrors,
    dryRun: Boolean(request.dryRun),
    createdAt: new Date().toISOString(),
  };
}

export async function executeForgeImport(request: ForgeImportRequest): Promise<ForgeImportResult> {
  const target = getImportCardTarget(request.kind);
  if (!target) {
    const receipt = buildReceipt(request, [], 'failed');
    return { ok: false, mappedRows: [], receipt: { ...receipt, errors: [`Unknown import kind: ${request.kind}`] } };
  }

  const mappedRows = request.rows.map((row, index) => mapRow(request.kind, row, index, request.fieldMap));
  const hasErrors = mappedRows.some((row) => row.errors.length > 0);
  const status = request.dryRun ? 'previewed' : hasErrors ? 'failed' : 'imported';
  const receipt = buildReceipt(request, mappedRows, status);

  // Forge owns execution. SQL writes are intentionally injected by the host runtime.
  // This executor returns normalized rows plus a receipt so the runtime can commit,
  // replay, or reject according to authority policy.
  return {
    ok: !hasErrors || Boolean(request.dryRun),
    mappedRows,
    receipt,
  };
}
