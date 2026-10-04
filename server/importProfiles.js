import * as XLSX from 'xlsx';

export const STEELCRAFT_WORKBOOK_MAPPING_KEY = 'steelcraft_quote_workbook';
export const GENERIC_WORKBOOK_MAPPING_KEY = 'generic_workbook_profile';
export const MONDAY_MAPPING_KEY = 'monday_board_profile';

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'tenant';
}

function text(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function sheetRows(sheet) {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
}

function formulasForSheet(sheet, sheetName) {
  return Object.entries(sheet || {})
    .filter(([address, value]) => !address.startsWith('!') && value?.f)
    .map(([address, value]) => ({
      sheetName,
      cellAddress: address,
      formula: value.f,
      cachedValue: value.v ?? null,
      type: value.t ?? null,
      numberFormat: value.z ?? null,
      dependencies: String(value.f).match(/(?:'[^']+'|[A-Za-z0-9_ ]+)!\$?[A-Z]{1,3}\$?\d+|\$?[A-Z]{1,3}\$?\d+/g) || []
    }));
}

function cellValue(sheet, address) {
  const item = sheet?.[address];
  return item ? item.v ?? null : null;
}

export function defaultSteelCraftImportProfile(tenantKey = 'steelcraft') {
  return {
    tenantKey,
    workbook: steelCraftWorkbookMapping(),
    monday: steelCraftMondayMapping(),
    genericWorkbook: genericWorkbookMapping()
  };
}

export function steelCraftWorkbookMapping() {
  return {
    key: STEELCRAFT_WORKBOOK_MAPPING_KEY,
    label: 'Steel Craft estimating workbook',
    scope: 'tenant_profile',
    ownerProfile: 'steelcraft',
    parser: 'steelcraft_quote_workbook_v1',
    description: 'Seth / Steel Craft estimating workbook map. This is not a platform-wide workbook parser.',
    requiredSheets: ['Estimate Sheet', 'Project Info', 'F&E Quotation', 'EO Quotation'],
    optionalSheets: ['Project Checklist', 'Invoice', 'Material SOV 1', 'Material SOV 2', 'Material SOV 3', 'Material SOV 4', 'Labor SOV 1', 'Labor SOV 2', 'CO Totals', 'Dynamic Doors'],
    fields: [
      ['estimate_number', 'Estimate Sheet', 'F7', 'source'],
      ['project_name', 'Estimate Sheet', 'C5', 'source'],
      ['estimator_name', 'Estimate Sheet', 'C6', 'source'],
      ['square_feet', 'Estimate Sheet', 'F5', 'source'],
      ['local_tax_rate', 'Estimate Sheet', 'C7', 'source'],
      ['customer_company', 'Project Info', 'G12', 'source'],
      ['customer_contact', 'Project Info', 'E14', 'source'],
      ['customer_phone', 'Project Info', 'K14', 'source'],
      ['customer_email', 'Project Info', 'E19', 'source'],
      ['project_address', 'Project Info', 'E9', 'source'],
      ['city_state_zip', 'Project Info', 'E10', 'source'],
      ['billing_address', 'Project Info', 'E16', 'source'],
      ['accounts_payable', 'Project Info', 'J24', 'source'],
      ['accounts_payable_email', 'Project Info', 'J25', 'source'],
      ['building_cost', 'Estimate Sheet', 'I6', 'calculated'],
      ['alternate_cost', 'Estimate Sheet', 'I7', 'calculated'],
      ['cost_with_alternates', 'Estimate Sheet', 'I8', 'calculated'],
      ['gross_profit', 'Estimate Sheet', 'I15', 'calculated'],
      ['erection_price', 'Estimate Sheet', 'F23', 'calculated'],
      ['project_price', 'Estimate Sheet', 'F24', 'calculated'],
      ['total_with_alternates', 'Estimate Sheet', 'F25', 'calculated'],
      ['material_deposit_total', 'Estimate Sheet', 'I24', 'calculated'],
      ['labor_deposit_total', 'Estimate Sheet', 'I27', 'calculated'],
      ['fe_subtotal', 'F&E Quotation', 'K42', 'calculated'],
      ['fe_tax', 'F&E Quotation', 'K43', 'calculated'],
      ['fe_labor', 'F&E Quotation', 'K44', 'calculated'],
      ['fe_total', 'F&E Quotation', 'K45', 'calculated'],
      ['fe_total_with_alternates', 'F&E Quotation', 'K46', 'calculated'],
      ['eo_material_subtotal', 'EO Quotation', 'K25', 'calculated'],
      ['eo_tax', 'EO Quotation', 'K26', 'calculated'],
      ['eo_labor', 'EO Quotation', 'K27', 'calculated'],
      ['eo_total', 'EO Quotation', 'K28', 'calculated']
    ].map(([fieldKey, sheetName, cellAddress, role]) => ({ fieldKey, sheetName, cellAddress, role })),
    ranges: [
      ['base_cost_rows', 'Estimate Sheet', 'B11:F18', 'estimate_cost_lines', 'base_costs'],
      ['alternate_rows', 'Estimate Sheet', 'B32:J41', 'estimate_cost_lines', 'alternates'],
      ['deposit_schedule', 'Estimate Sheet', 'I18:J27', 'estimate_deposit_schedule', 'deposits'],
      ['fe_quote_lines', 'F&E Quotation', 'D24:K46', 'quotation_lines', 'furnish_and_erect'],
      ['eo_quote_lines', 'EO Quotation', 'D18:K28', 'quotation_lines', 'erection_only'],
      ['project_checklist', 'Project Checklist', 'A7:M21', 'project_checklist_items', 'scope_handoff'],
      ['invoice_draws', 'Invoice', 'W3:AB8', 'invoices', 'draw_billing'],
      ['material_sov_1', 'Material SOV 1', 'B8:I27', 'schedule_of_values', 'material_draw_1'],
      ['material_sov_2', 'Material SOV 2', 'B8:I27', 'schedule_of_values', 'material_draw_2'],
      ['material_sov_3', 'Material SOV 3', 'B8:I27', 'schedule_of_values', 'material_draw_3'],
      ['material_sov_4', 'Material SOV 4', 'B8:I27', 'schedule_of_values', 'material_draw_4'],
      ['labor_sov_1', 'Labor SOV 1', 'B8:I27', 'schedule_of_values', 'labor_draw_1'],
      ['labor_sov_2', 'Labor SOV 2', 'B8:I27', 'schedule_of_values', 'labor_draw_2'],
      ['change_order_totals', 'CO Totals', 'A8:J17', 'change_orders', 'change_order_rollup'],
      ['dynamic_doors_catalog', 'Dynamic Doors', 'B3:J88', 'quote_reference_catalog', 'doors']
    ].map(([key, sheetName, rangeAddress, targetTable, targetSection]) => ({ key, sheetName, rangeAddress, targetTable, targetSection })),
    automations: [
      ['workbook_imported', 'Workbook uploaded and parsed', 'quote_workbooks'],
      ['project_info_to_estimate', 'Project Info populates estimate header and customer fields', 'estimates'],
      ['estimate_to_fe_quote', 'Estimate Sheet pushes totals into F&E Quotation', 'quotation_versions'],
      ['estimate_to_eo_quote', 'Estimate Sheet pushes erection-only totals into EO Quotation', 'quotation_versions'],
      ['estimate_to_checklist', 'Estimate creates project checklist scope items', 'project_checklist_items'],
      ['deposit_to_sov_invoice', 'Deposit schedule creates SOV and invoice draw workflow', 'schedule_of_values'],
      ['change_order_rollup', 'CO1-CO10 roll up to CO Totals and draw billing', 'change_orders'],
      ['handoff', 'Approved quote can hand off to Projects, Accounting, and Purchasing', 'workflow']
    ].map(([key, label, output]) => ({ key, label, output }))
  };
}

export function genericWorkbookMapping() {
  return {
    key: GENERIC_WORKBOOK_MAPPING_KEY,
    label: 'Generic customer workbook intake',
    scope: 'tenant_profile',
    parser: 'generic_workbook_profiler_v1',
    description: 'Reusable spreadsheet intake for future customer profiles. It stores sheets, previews, formulas, defined names, and mapping drafts without assuming Steel Craft sheet names.',
    requiredSheets: [],
    optionalSheets: [],
    fields: [],
    ranges: [],
    automations: [
      { key: 'profile_workbook_uploaded', label: 'Workbook uploaded into tenant profile', output: 'tenant_workbook_uploads' },
      { key: 'sheet_profiled', label: 'Sheets, formulas, and previews profiled for mapping', output: 'tenant_workbook_sheets' },
      { key: 'mapping_ready', label: 'Ready for room-by-room field mapping', output: 'tenant_import_mappings' }
    ]
  };
}

export function steelCraftMondayMapping() {
  return {
    key: MONDAY_MAPPING_KEY,
    label: 'Steel Craft Monday.com board migration',
    scope: 'tenant_profile',
    ownerProfile: 'steelcraft',
    connector: 'monday.com',
    description: 'Steel Craft Monday boards are source data for the Steel Craft profile only. Other customers get their own Monday mapping and token.',
    boardDestinations: [
      ['sales', 'Sales / estimating intake', 'estimating'],
      ['estimating', 'Quote and estimate production', 'estimating'],
      ['projects', 'Project execution', 'projects'],
      ['planning', 'Production and readiness planning', 'planning'],
      ['purchasing', 'PO and vendor handoff', 'purchasing'],
      ['accounting', 'Billing, AR, AP, SOV, and change orders', 'accounting'],
      ['contacts', 'Customers, vendors, contractors, and contacts', 'contacts'],
      ['hr', 'Employee and HR operational records', 'hr']
    ].map(([key, label, portal]) => ({ key, label, portal })),
    defaultColumnRoles: ['status', 'owner', 'date', 'timeline', 'customer', 'project', 'amount', 'notes', 'files', 'proof']
  };
}

export function workbookProfileFromBuffer(buffer, originalName, mapping = genericWorkbookMapping()) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellDates: true, cellStyles: true });
  const sheets = wb.SheetNames.map((name, index) => {
    const sheet = wb.Sheets[name];
    const rows = sheetRows(sheet);
    const formulas = formulasForSheet(sheet, name);
    return {
      name,
      index,
      range: sheet?.['!ref'] || null,
      rowCount: rows.length,
      columnCount: rows.reduce((max, row) => Math.max(max, row.length), 0),
      previewRows: rows.slice(0, 12),
      formulaCount: formulas.length,
      formulas,
      merges: (sheet?.['!merges'] || []).map((merge) => XLSX.utils.encode_range(merge))
    };
  });

  const sheetNames = new Set(wb.SheetNames);
  const requiredSheets = mapping.requiredSheets || [];
  const optionalSheets = mapping.optionalSheets || [];
  const matchedRequired = requiredSheets.filter((name) => sheetNames.has(name));
  const missingRequired = requiredSheets.filter((name) => !sheetNames.has(name));
  const matchedOptional = optionalSheets.filter((name) => sheetNames.has(name));
  const mappedFields = (mapping.fields || []).map((field) => ({
    ...field,
    value: cellValue(wb.Sheets[field.sheetName], field.cellAddress),
    present: Boolean(wb.Sheets[field.sheetName])
  }));

  return {
    originalName,
    mappingKey: mapping.key,
    mappingLabel: mapping.label,
    parser: mapping.parser,
    sheetCount: wb.SheetNames.length,
    sheetOrder: wb.SheetNames,
    requiredSheets,
    matchedRequired,
    missingRequired,
    matchedOptional,
    mappedFields,
    mappedRanges: mapping.ranges || [],
    automations: mapping.automations || [],
    definedNames: (wb.Workbook?.Names || []).map((item) => ({ name: item.Name, formula: item.Ref, sheet: item.Sheet ?? null })),
    sheets,
    confidence: requiredSheets.length ? matchedRequired.length / requiredSheets.length : 0,
    readyForMappedImport: requiredSheets.length ? missingRequired.length === 0 : false
  };
}

export async function ensureImportProfileSchema(db, steelcraftProfileKey = 'steelcraft') {
  await db.query(`
    create table if not exists tenant_import_mappings (
      id bigserial primary key,
      tenant_key text not null,
      mapping_key text not null,
      mapping_type text not null,
      label text not null,
      parser text,
      status text not null default 'active',
      mapping jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_key, mapping_key)
    );

    create table if not exists tenant_workbook_uploads (
      id bigserial primary key,
      tenant_key text not null,
      mapping_key text not null default 'generic_workbook_profile',
      original_filename text not null,
      file_size bigint not null default 0,
      sheet_count integer not null default 0,
      status text not null default 'profiled',
      profile_summary jsonb not null default '{}'::jsonb,
      created_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists tenant_workbook_sheets (
      id bigserial primary key,
      workbook_upload_id bigint not null references tenant_workbook_uploads(id) on delete cascade,
      tenant_key text not null,
      sheet_name text not null,
      row_count integer not null default 0,
      column_count integer not null default 0,
      formula_count integer not null default 0,
      preview_rows jsonb not null default '[]'::jsonb,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists tenant_monday_source_mappings (
      id bigserial primary key,
      tenant_key text not null,
      board_id text not null,
      board_name text not null,
      destination_portal text,
      mapping_status text not null default 'profiled',
      column_profile jsonb not null default '[]'::jsonb,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_key, board_id)
    );
  `);

  await seedSteelCraftImportMappings(db, steelcraftProfileKey);
}

export async function seedSteelCraftImportMappings(db, tenantKey = 'steelcraft') {
  const mappings = [
    { key: STEELCRAFT_WORKBOOK_MAPPING_KEY, type: 'workbook', label: 'Steel Craft estimating workbook', parser: 'steelcraft_quote_workbook_v1', mapping: steelCraftWorkbookMapping() },
    { key: GENERIC_WORKBOOK_MAPPING_KEY, type: 'workbook', label: 'Generic customer workbook intake', parser: 'generic_workbook_profiler_v1', mapping: genericWorkbookMapping() },
    { key: MONDAY_MAPPING_KEY, type: 'monday', label: 'Steel Craft Monday.com board migration', parser: 'monday_board_profile_v1', mapping: steelCraftMondayMapping() }
  ];

  for (const item of mappings) {
    await db.query(
      `insert into tenant_import_mappings (tenant_key, mapping_key, mapping_type, label, parser, status, mapping)
       values ($1,$2,$3,$4,$5,'active',$6)
       on conflict (tenant_key, mapping_key)
       do update set label = excluded.label, parser = excluded.parser, mapping = excluded.mapping, updated_at = now()`,
      [tenantKey, item.key, item.type, item.label, item.parser, item.mapping]
    );
  }
}

export async function getTenantImportProfile(db, tenantKey = 'steelcraft') {
  await ensureImportProfileSchema(db, tenantKey === 'steelcraft' ? tenantKey : 'steelcraft');
  const mappings = await db.query('select mapping_key, mapping_type, label, parser, status, mapping, updated_at from tenant_import_mappings where tenant_key = $1 order by mapping_type, label', [tenantKey]);
  return { tenantKey, mappings: mappings.rows };
}

export async function upsertTenantImportMapping(db, tenantKey, mappingKey, payload = {}) {
  const type = payload.mappingType || payload.mapping_type || payload.type || 'workbook';
  const label = payload.label || mappingKey;
  const parser = payload.parser || 'generic_workbook_profiler_v1';
  const mapping = payload.mapping || payload;
  const result = await db.query(
    `insert into tenant_import_mappings (tenant_key, mapping_key, mapping_type, label, parser, status, mapping)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (tenant_key, mapping_key)
     do update set mapping_type = excluded.mapping_type, label = excluded.label, parser = excluded.parser, status = excluded.status, mapping = excluded.mapping, updated_at = now()
     returning *`,
    [tenantKey, mappingKey, type, label, parser, payload.status || 'active', mapping]
  );
  return result.rows[0];
}

export async function loadWorkbookMapping(db, tenantKey, mappingKey = GENERIC_WORKBOOK_MAPPING_KEY) {
  const result = await db.query('select mapping from tenant_import_mappings where tenant_key = $1 and mapping_key = $2', [tenantKey, mappingKey]);
  return result.rows[0]?.mapping || (mappingKey === STEELCRAFT_WORKBOOK_MAPPING_KEY ? steelCraftWorkbookMapping() : genericWorkbookMapping());
}

export async function profileWorkbookUpload(db, { tenantKey, file, actor = 'import', mappingKey = GENERIC_WORKBOOK_MAPPING_KEY }) {
  if (!file?.buffer?.length) {
    const error = new Error('No workbook file was uploaded.');
    error.statusCode = 400;
    throw error;
  }

  const mapping = await loadWorkbookMapping(db, tenantKey, mappingKey);
  const summary = workbookProfileFromBuffer(file.buffer, file.originalname, mapping);
  const uploadResult = await db.query(
    `insert into tenant_workbook_uploads (tenant_key, mapping_key, original_filename, file_size, sheet_count, status, profile_summary, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [tenantKey, mappingKey, file.originalname, file.size || file.buffer.length, summary.sheetCount, summary.readyForMappedImport ? 'mapped_ready' : 'profiled', summary, actor]
  );
  const upload = uploadResult.rows[0];

  for (const sheet of summary.sheets) {
    await db.query(
      `insert into tenant_workbook_sheets (workbook_upload_id, tenant_key, sheet_name, row_count, column_count, formula_count, preview_rows, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [upload.id, tenantKey, sheet.name, sheet.rowCount, sheet.columnCount, sheet.formulaCount, sheet.previewRows, sheet]
    );
  }

  await db.query(
    `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata)
     values ($1,$2,$3,$4,$5)`,
    [actor, 'tenant_workbook_profiled', 'tenant_workbook_upload', String(upload.id), { tenantKey, mappingKey, sheetCount: summary.sheetCount, missingRequired: summary.missingRequired }]
  );

  return { upload, summary };
}

export async function listProfileWorkbookUploads(db, tenantKey) {
  const result = await db.query('select id, tenant_key, mapping_key, original_filename, file_size, sheet_count, status, profile_summary, created_by, created_at, updated_at from tenant_workbook_uploads where tenant_key = $1 order by created_at desc limit 50', [tenantKey]);
  return result.rows;
}

export async function getProfileWorkbookUpload(db, tenantKey, id) {
  const upload = await db.query('select * from tenant_workbook_uploads where tenant_key = $1 and id = $2', [tenantKey, id]);
  if (!upload.rows[0]) return null;
  const sheets = await db.query('select * from tenant_workbook_sheets where tenant_key = $1 and workbook_upload_id = $2 order by id', [tenantKey, id]);
  return { upload: upload.rows[0], sheets: sheets.rows };
}

export function tenantMondayEnvKey(tenantKey) {
  return `MONDAY_API_TOKEN_${normalizeKey(tenantKey).toUpperCase()}`;
}

export async function upsertMondaySourceMapping(db, tenantKey, board, destinationPortal = null) {
  const columnProfile = (board.columns || []).map((column) => ({ id: column.id, title: column.title, type: column.type, role: null }));
  const result = await db.query(
    `insert into tenant_monday_source_mappings (tenant_key, board_id, board_name, destination_portal, mapping_status, column_profile, raw)
     values ($1,$2,$3,$4,'profiled',$5,$6)
     on conflict (tenant_key, board_id)
     do update set board_name = excluded.board_name, destination_portal = coalesce(excluded.destination_portal, tenant_monday_source_mappings.destination_portal), column_profile = excluded.column_profile, raw = excluded.raw, updated_at = now()
     returning *`,
    [tenantKey, board.id, board.name, destinationPortal, columnProfile, board]
  );
  return result.rows[0];
}
