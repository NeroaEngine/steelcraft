import { getSteelCraftAllCardManifests } from '../components/cards/steelcraft-all-card-manifests';

export type CardSqlMapEntry = {
  cardId: string;
  roomId: string;
  primaryTable: string;
  relatedTables: string[];
  writeMode: 'projection' | 'transaction' | 'document' | 'readonly';
};

export const cardSqlMap: CardSqlMapEntry[] = [
  { cardId: 'lead-generation', roomId: 'crm-sales', primaryTable: 'crm_leads', relatedTables: ['crm_accounts', 'crm_contacts', 'crm_followups'], writeMode: 'transaction' },
  { cardId: 'quote', roomId: 'crm-sales', primaryTable: 'quotes', relatedTables: ['crm_accounts', 'crm_contacts', 'project_activity'], writeMode: 'transaction' },
  { cardId: 'project-information', roomId: 'estimating', primaryTable: 'quote_project_information', relatedTables: ['quotes', 'crm_accounts', 'crm_contacts'], writeMode: 'transaction' },
  { cardId: 'working-sheet', roomId: 'estimating', primaryTable: 'quote_working_sheets', relatedTables: ['quotes', 'quote_scope_items'], writeMode: 'transaction' },
  { cardId: 'manufacturer-import', roomId: 'estimating', primaryTable: 'manufacturer_quotes', relatedTables: ['quote_building_requirements', 'documents'], writeMode: 'transaction' },
  { cardId: 'estimate', roomId: 'estimating', primaryTable: 'estimates', relatedTables: ['estimate_totals', 'estimate_cost_items'], writeMode: 'transaction' },
  { cardId: 'alternates', roomId: 'estimating', primaryTable: 'estimate_alternates', relatedTables: ['estimates', 'schedule_of_values'], writeMode: 'transaction' },
  { cardId: 'pricing-summary', roomId: 'estimating', primaryTable: 'estimate_totals', relatedTables: ['estimates', 'estimate_alternates'], writeMode: 'projection' },
  { cardId: 'margin-analysis', roomId: 'estimating', primaryTable: 'estimate_totals', relatedTables: ['estimates'], writeMode: 'projection' },
  { cardId: 'plan-upload', roomId: 'model-designer', primaryTable: 'plan_uploads', relatedTables: ['documents', 'document_versions'], writeMode: 'document' },
  { cardId: 'building-designer', roomId: 'model-designer', primaryTable: 'building_models', relatedTables: ['building_model_versions', 'component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'structural', roomId: 'model-designer', primaryTable: 'building_structural_systems', relatedTables: ['building_models', 'component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'roof-systems', roomId: 'model-designer', primaryTable: 'building_roof_systems', relatedTables: ['building_models', 'component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'wall-systems', roomId: 'model-designer', primaryTable: 'building_wall_systems', relatedTables: ['building_models', 'component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'doors', roomId: 'model-designer', primaryTable: 'building_doors', relatedTables: ['vendor_catalog_items', 'component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'windows', roomId: 'model-designer', primaryTable: 'building_windows', relatedTables: ['component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'accessories', roomId: 'model-designer', primaryTable: 'building_accessories', relatedTables: ['component_takeoffs'], writeMode: 'transaction' },
  { cardId: 'component-takeoff', roomId: 'model-designer', primaryTable: 'component_takeoffs', relatedTables: ['component_takeoff_items', 'estimates'], writeMode: 'transaction' },
  { cardId: 'mbs-export', roomId: 'model-designer', primaryTable: 'mbs_exports', relatedTables: ['mbs_imports', 'building_models', 'manufacturer_quotes'], writeMode: 'transaction' },
  { cardId: 'fe-quotation', roomId: 'proposal', primaryTable: 'proposals', relatedTables: ['proposal_documents', 'documents'], writeMode: 'document' },
  { cardId: 'eo-quotation', roomId: 'proposal', primaryTable: 'erection_proposals', relatedTables: ['proposal_documents', 'documents'], writeMode: 'document' },
  { cardId: 'proposal-review', roomId: 'proposal', primaryTable: 'proposal_reviews', relatedTables: ['proposals', 'project_activity'], writeMode: 'transaction' },
  { cardId: 'proposal-output', roomId: 'proposal', primaryTable: 'proposal_documents', relatedTables: ['documents', 'customer_portal_updates'], writeMode: 'document' },
  { cardId: 'contract-conversion', roomId: 'contract', primaryTable: 'contracts', relatedTables: ['projects', 'quotes', 'schedule_of_values'], writeMode: 'transaction' },
  { cardId: 'project-delivery', roomId: 'project-delivery', primaryTable: 'project_delivery', relatedTables: ['project_milestones', 'drawings', 'documents'], writeMode: 'transaction' },
  { cardId: 'schedule-of-values', roomId: 'schedule-of-values', primaryTable: 'schedule_of_values', relatedTables: ['sov_draws', 'invoices'], writeMode: 'transaction' },
  { cardId: 'change-orders', roomId: 'change-orders', primaryTable: 'change_orders', relatedTables: ['change_order_approvals', 'schedule_of_values', 'invoices'], writeMode: 'transaction' },
  { cardId: 'invoice', roomId: 'billing-insurance', primaryTable: 'invoices', relatedTables: ['receivables', 'customer_portal_updates'], writeMode: 'document' },
  { cardId: 'erection', roomId: 'erection', primaryTable: 'erection_schedule', relatedTables: ['daily_logs', 'photos', 'crews'], writeMode: 'transaction' },
];

export function getCardSqlMap(): CardSqlMapEntry[] {
  return cardSqlMap;
}

export function getSqlMapForCard(cardId: string): CardSqlMapEntry | undefined {
  return cardSqlMap.find((entry) => entry.cardId === cardId);
}

export function getHydratableCardManifests() {
  const maps = new Map(cardSqlMap.map((entry) => [entry.cardId, entry]));
  return getSteelCraftAllCardManifests().map((manifest) => ({
    ...manifest,
    sql: maps.get(manifest.id) || null,
  }));
}
