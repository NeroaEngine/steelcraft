export type ImportSourceType = 'monday-board' | 'spreadsheet' | 'csv' | 'manual';
export type ImportTargetCardId = 'contacts' | 'accounts' | 'project-delivery' | 'erection-schedule';

export type ImportCardTarget = {
  id: ImportTargetCardId;
  title: string;
  sourceTypes: ImportSourceType[];
  primaryTable: string;
  relatedTables: string[];
  requiredFields: string[];
  optionalFields: string[];
  cardManifestIds: string[];
};

export const importCardTargets: ImportCardTarget[] = [
  {
    id: 'contacts',
    title: 'Contacts Import',
    sourceTypes: ['spreadsheet', 'csv', 'monday-board'],
    primaryTable: 'crm_contacts',
    relatedTables: ['crm_accounts'],
    requiredFields: ['name'],
    optionalFields: ['email', 'phone', 'company', 'title', 'role', 'notes'],
    cardManifestIds: ['contact'],
  },
  {
    id: 'accounts',
    title: 'Accounts Import',
    sourceTypes: ['spreadsheet', 'csv', 'monday-board'],
    primaryTable: 'crm_accounts',
    relatedTables: ['crm_contacts'],
    requiredFields: ['accountName'],
    optionalFields: ['accountType', 'address', 'phone', 'website', 'primaryContact', 'notes'],
    cardManifestIds: ['account'],
  },
  {
    id: 'project-delivery',
    title: 'Project Delivery Import',
    sourceTypes: ['monday-board', 'spreadsheet', 'csv'],
    primaryTable: 'project_delivery',
    relatedTables: ['projects', 'project_milestones', 'drawings', 'documents'],
    requiredFields: ['projectName'],
    optionalFields: ['manufacturer', 'mbsJobNumber', 'engineeringStatus', 'drawingStage', 'productionStatus', 'deliveryDate', 'projectManager', 'notes'],
    cardManifestIds: ['project-delivery'],
  },
  {
    id: 'erection-schedule',
    title: 'Erection Schedule Import',
    sourceTypes: ['monday-board', 'spreadsheet', 'csv'],
    primaryTable: 'erection_schedule',
    relatedTables: ['projects', 'crews', 'daily_logs', 'photos'],
    requiredFields: ['projectName'],
    optionalFields: ['deliveryDate', 'erectionStartDate', 'crew', 'superintendent', 'percentComplete', 'status', 'notes'],
    cardManifestIds: ['erection'],
  },
];

export function getImportCardTargets(): ImportCardTarget[] {
  return importCardTargets;
}

export function getImportCardTarget(id: ImportTargetCardId): ImportCardTarget | undefined {
  return importCardTargets.find((target) => target.id === id);
}
