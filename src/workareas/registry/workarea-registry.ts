import type { WorkAreaId, WorkAreaManifest } from '../contracts/workarea-contract';

export const steelCraftWorkAreas: WorkAreaManifest[] = [
  { id: 'command-center', title: 'Command Center', description: 'Steel Craft OS front door and operational overview.', cardIds: ['project-summary', 'today-priorities', 'recent-activity'] },
  { id: 'crm-sales', title: 'CRM & Sales', description: 'Lead intake through contract award.', cardIds: ['lead', 'account', 'contact', 'follow-up', 'proposal-history'] },
  { id: 'estimating', title: 'Estimating', description: 'Quote import, yellow inputs, estimate calculations, alternates, and markup.', cardIds: ['manufacturer-quote', 'estimate', 'alternates', 'margin'] },
  { id: 'proposal', title: 'Proposal', description: 'Proposal generation and customer quote package.', cardIds: ['proposal', 'proposal-documents'] },
  { id: 'contract', title: 'Contract', description: 'Contract conversion, permanent SCB project number, and secondary identifiers.', cardIds: ['contract', 'project-identifiers'] },
  { id: 'schedule-of-values', title: 'Schedule of Values', description: 'Material and labor draw schedule tied to contract value.', cardIds: ['schedule-of-values', 'material-draws', 'labor-draws'] },
  { id: 'billing-insurance', title: 'Billing & Insurance', description: 'Invoices, AR/AP tracking, NTOs, lien waivers, COIs, and insurance.', cardIds: ['invoice', 'receivables', 'payables', 'insurance'] },
  { id: 'project-delivery', title: 'Project Delivery', description: 'Approval drawings, revision cycle, release for production, fabrication, and delivery.', cardIds: ['drawings', 'delivery-milestones', 'production-hold'] },
  { id: 'erection', title: 'Erection', description: 'Crew assignment, superintendent view, photos, daily logs, percent complete, and pay apps.', cardIds: ['erection-schedule', 'crew', 'daily-log', 'photos'] },
  { id: 'vendor-portal', title: 'Vendor Portal', description: 'Vendor uploads, POs, payment status, RFIs, and historical documents.', cardIds: ['vendor', 'purchase-order', 'rfi', 'vendor-documents'] },
  { id: 'customer-portal', title: 'Customer Portal', description: 'Approved customer visibility into drawings, invoices, SOV, progress photos, and milestones.', cardIds: ['customer-status', 'customer-documents', 'customer-billing'] },
  { id: 'documents', title: 'Documents', description: 'Versioned drawings, permits, contracts, invoices, files, and project documents.', cardIds: ['documents', 'version-history'] },
  { id: 'change-orders', title: 'Change Orders', description: 'Design revisions, material escalation, scope changes, site conditions, and owner requests.', cardIds: ['change-order', 'change-order-approval'] },
  { id: 'activity-timeline', title: 'Activity Timeline', description: 'Milestones, user activity, audit trail, receipts, and project history.', cardIds: ['activity', 'receipts', 'audit-trail'] },
  { id: 'import-center', title: 'Import Center', description: 'Protected import workflows for Monday exports, contacts, accounts, projects, billing, erection, estimates, and quote CSVs.', cardIds: ['import-status', 'monday-import', 'spreadsheet-import'], protected: true },
];

export function getWorkAreas(): WorkAreaManifest[] {
  return steelCraftWorkAreas;
}

export function getWorkArea(id: WorkAreaId): WorkAreaManifest | undefined {
  return steelCraftWorkAreas.find((workArea) => workArea.id === id);
}
