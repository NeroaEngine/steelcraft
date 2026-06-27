import type { SteelCraftCard } from '../contracts/card-contract';

export const steelCraftCards: SteelCraftCard[] = [
  { id: 'project-summary', kind: 'project', title: 'Project Summary', description: 'Master project status and identifiers.', workAreaId: 'command-center', sqlTable: 'projects' },
  { id: 'today-priorities', kind: 'activity', title: 'Today Priorities', description: 'Quotes due, follow-ups, RFIs, billing, and delivery priorities.', workAreaId: 'command-center', sqlTable: 'project_activity' },
  { id: 'recent-activity', kind: 'activity', title: 'Recent Activity', description: 'Latest project events and receipts.', workAreaId: 'command-center', sqlTable: 'project_activity' },

  { id: 'lead', kind: 'crm', title: 'Lead', description: 'Lead source, bid due date, quote status, estimator, and salesperson.', workAreaId: 'crm-sales', sqlTable: 'crm_leads' },
  { id: 'account', kind: 'crm', title: 'Account', description: 'Customer, GC, architect, vendor, and organization records.', workAreaId: 'crm-sales', sqlTable: 'crm_accounts' },
  { id: 'contact', kind: 'crm', title: 'Contact', description: 'People, emails, phones, roles, and linked accounts.', workAreaId: 'crm-sales', sqlTable: 'crm_contacts' },
  { id: 'follow-up', kind: 'crm', title: 'Follow-Up', description: '7, 15, 30, 60, and 90 day reminders and email templates.', workAreaId: 'crm-sales', sqlTable: 'crm_followups' },
  { id: 'proposal-history', kind: 'proposal', title: 'Proposal History', description: 'Proposal versions and sent history.', workAreaId: 'crm-sales', sqlTable: 'proposals' },

  { id: 'manufacturer-quote', kind: 'estimate', title: 'Manufacturer Quote', description: 'PDF quote import and extracted building details.', workAreaId: 'estimating', sqlTable: 'manufacturer_quotes' },
  { id: 'estimate', kind: 'estimate', title: 'Estimate', description: 'Yellow input fields and generated white outputs.', workAreaId: 'estimating', sqlTable: 'estimates' },
  { id: 'alternates', kind: 'estimate', title: 'Alternates', description: 'Structured alternate line items with markup and labor.', workAreaId: 'estimating', sqlTable: 'estimate_alternates' },
  { id: 'margin', kind: 'estimate', title: 'Margin', description: 'Gross margin, net margin, project price, and alternates price.', workAreaId: 'estimating', sqlTable: 'estimate_totals' },

  { id: 'proposal', kind: 'proposal', title: 'Proposal', description: 'Proposal package and quote output.', workAreaId: 'proposal', sqlTable: 'proposals' },
  { id: 'proposal-documents', kind: 'document', title: 'Proposal Documents', description: 'Generated proposal PDFs and supporting files.', workAreaId: 'proposal', sqlTable: 'documents' },

  { id: 'contract', kind: 'contract', title: 'Contract', description: 'Signed contract and award details.', workAreaId: 'contract', sqlTable: 'contracts' },
  { id: 'project-identifiers', kind: 'project', title: 'Project Identifiers', description: 'SCB number, manufacturer job number, customer PO, and contract number.', workAreaId: 'contract', sqlTable: 'projects' },

  { id: 'schedule-of-values', kind: 'schedule-of-values', title: 'Schedule of Values', description: 'Contract amount plus alternates and approved change orders.', workAreaId: 'schedule-of-values', sqlTable: 'schedule_of_values' },
  { id: 'material-draws', kind: 'schedule-of-values', title: 'Material Draws', description: 'Material draws 1 through 4.', workAreaId: 'schedule-of-values', sqlTable: 'sov_draws' },
  { id: 'labor-draws', kind: 'schedule-of-values', title: 'Labor Draws', description: 'Labor draw 1 and 2.', workAreaId: 'schedule-of-values', sqlTable: 'sov_draws' },

  { id: 'invoice', kind: 'billing', title: 'Invoice', description: 'Invoice generation for material and labor draws.', workAreaId: 'billing-insurance', sqlTable: 'invoices' },
  { id: 'receivables', kind: 'billing', title: 'Receivables', description: 'Invoice sent, due date, payment status, and days outstanding.', workAreaId: 'billing-insurance', sqlTable: 'receivables' },
  { id: 'payables', kind: 'billing', title: 'Payables', description: 'Vendor bills, paid date, and payment status.', workAreaId: 'billing-insurance', sqlTable: 'payables' },
  { id: 'insurance', kind: 'billing', title: 'Insurance', description: 'COIs, builder risk, bonding, notices, NTOs, and lien waivers.', workAreaId: 'billing-insurance', sqlTable: 'insurance_records' },

  { id: 'drawings', kind: 'delivery', title: 'Drawings', description: 'Approval drawings, signed and sealed drawings, and version history.', workAreaId: 'project-delivery', sqlTable: 'drawings' },
  { id: 'delivery-milestones', kind: 'delivery', title: 'Delivery Milestones', description: 'Production hold, approval review, release, fabrication, delivery.', workAreaId: 'project-delivery', sqlTable: 'project_milestones' },
  { id: 'production-hold', kind: 'delivery', title: 'Production Hold', description: 'Release gate before fabrication.', workAreaId: 'project-delivery', sqlTable: 'production_holds' },

  { id: 'erection-schedule', kind: 'erection', title: 'Erection Schedule', description: 'Building delivery date, crew assignment, and erection schedule.', workAreaId: 'erection', sqlTable: 'erection_schedule' },
  { id: 'crew', kind: 'erection', title: 'Crew', description: 'Crew, superintendent, subcontractor, and assigned jobs.', workAreaId: 'erection', sqlTable: 'crews' },
  { id: 'daily-log', kind: 'erection', title: 'Daily Log', description: 'Daily logs, safety notes, percent complete, and field updates.', workAreaId: 'erection', sqlTable: 'daily_logs' },
  { id: 'photos', kind: 'erection', title: 'Photos', description: 'Progress and site condition photos.', workAreaId: 'erection', sqlTable: 'photos' },

  { id: 'vendor', kind: 'vendor', title: 'Vendor', description: 'Vendor access and assigned jobs.', workAreaId: 'vendor-portal', sqlTable: 'vendors' },
  { id: 'purchase-order', kind: 'vendor', title: 'Purchase Order', description: 'PO visibility and vendor package details.', workAreaId: 'vendor-portal', sqlTable: 'purchase_orders' },
  { id: 'rfi', kind: 'vendor', title: 'RFI', description: 'Vendor RFIs attached to project record.', workAreaId: 'vendor-portal', sqlTable: 'rfis' },
  { id: 'vendor-documents', kind: 'document', title: 'Vendor Documents', description: 'Vendor uploaded files and historical documents.', workAreaId: 'vendor-portal', sqlTable: 'documents' },

  { id: 'customer-status', kind: 'customer', title: 'Customer Status', description: 'Customer-facing project stage and milestone status.', workAreaId: 'customer-portal', sqlTable: 'project_milestones' },
  { id: 'customer-documents', kind: 'document', title: 'Customer Documents', description: 'Approved drawings, permits, invoices, SOV, photos, and change orders.', workAreaId: 'customer-portal', sqlTable: 'documents' },
  { id: 'customer-billing', kind: 'billing', title: 'Customer Billing', description: 'Current invoices, paid invoices, and upcoming billing milestones.', workAreaId: 'customer-portal', sqlTable: 'invoices' },

  { id: 'documents', kind: 'document', title: 'Documents', description: 'All project documents with version control.', workAreaId: 'documents', sqlTable: 'documents' },
  { id: 'version-history', kind: 'document', title: 'Version History', description: 'Document version history so old drawings never overwrite new drawings.', workAreaId: 'documents', sqlTable: 'document_versions' },

  { id: 'change-order', kind: 'change-order', title: 'Change Order', description: 'Design revisions, material escalation, scope additions/deletions, site conditions, and owner requests.', workAreaId: 'change-orders', sqlTable: 'change_orders' },
  { id: 'change-order-approval', kind: 'change-order', title: 'Change Order Approval', description: 'Approval workflow before contract/SOV/forecast updates.', workAreaId: 'change-orders', sqlTable: 'change_order_approvals' },

  { id: 'activity', kind: 'activity', title: 'Activity', description: 'Project timeline activity entries.', workAreaId: 'activity-timeline', sqlTable: 'project_activity' },
  { id: 'receipts', kind: 'activity', title: 'Receipts', description: 'Receipt and audit proof events.', workAreaId: 'activity-timeline', sqlTable: 'receipts' },
  { id: 'audit-trail', kind: 'activity', title: 'Audit Trail', description: 'Timestamp, user record, and evidence trail for milestones.', workAreaId: 'activity-timeline', sqlTable: 'audit_trail' },

  { id: 'import-status', kind: 'import', title: 'Import Status', description: 'Protected import status and mapping output.', workAreaId: 'import-center', sqlTable: 'import_runs', protected: true },
  { id: 'monday-import', kind: 'import', title: 'Monday Import', description: 'Monday accounts, contacts, project delivery, billing, and erection imports.', workAreaId: 'import-center', sqlTable: 'crm_monday_sync_runs', protected: true },
  { id: 'spreadsheet-import', kind: 'import', title: 'Spreadsheet Import', description: 'Estimate workbook and quotation CSV imports.', workAreaId: 'import-center', sqlTable: 'import_runs', protected: true },
];

export function getCards(): SteelCraftCard[] {
  return steelCraftCards;
}

export function getCard(id: string): SteelCraftCard | undefined {
  return steelCraftCards.find((card) => card.id === id);
}

export function getCardsForWorkArea(workAreaId: SteelCraftCard['workAreaId']): SteelCraftCard[] {
  return steelCraftCards.filter((card) => card.workAreaId === workAreaId);
}
