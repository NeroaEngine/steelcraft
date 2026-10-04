export async function ensureQuoteTemplateSchema(db) {
  await db.query(`
    create table if not exists quote_templates (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      template_name text not null,
      description text,
      source_workbook_id bigint references quote_workbooks(id) on delete set null,
      status text not null default 'draft',
      is_default boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists quote_template_versions (
      id bigserial primary key,
      template_id bigint not null references quote_templates(id) on delete cascade,
      version_number integer not null default 1,
      status text not null default 'draft',
      metadata jsonb not null default '{}'::jsonb,
      field_map jsonb not null default '[]'::jsonb,
      range_map jsonb not null default '[]'::jsonb,
      formula_map jsonb not null default '[]'::jsonb,
      automation_map jsonb not null default '[]'::jsonb,
      defaults jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (template_id, version_number)
    );

    create table if not exists quote_template_overrides (
      id bigserial primary key,
      template_version_id bigint not null references quote_template_versions(id) on delete cascade,
      override_type text not null,
      override_key text not null,
      label text,
      value jsonb not null default '{}'::jsonb,
      is_enabled boolean not null default true,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (template_version_id, override_type, override_key)
    );
  `);
}

export async function createTemplateFromWorkbook(db, workbookId, actor = 'estimating') {
  await ensureQuoteTemplateSchema(db);

  const workbookResult = await db.query('select * from quote_workbooks where id = $1', [workbookId]);
  const workbook = workbookResult.rows[0];
  if (!workbook) {
    const error = new Error('Quote workbook not found.');
    error.statusCode = 404;
    throw error;
  }

  const fields = await db.query(
    `select field_key, role, sheet_name, cell_address, cell_value, formula, cell_type, number_format
     from quote_workbook_metadata_fields
     where workbook_id = $1
     order by id`,
    [workbookId]
  );

  const ranges = await db.query(
    `select map_key, sheet_name, range_address, target_table, target_section, metadata
     from quote_workbook_metadata_ranges
     where workbook_id = $1
     order by id`,
    [workbookId]
  );

  const formulas = await db.query(
    `select sheet_name, cell_address, formula, cached_value, dependencies, metadata
     from quote_workbook_formulas
     where workbook_id = $1
     order by sheet_name, cell_address`,
    [workbookId]
  );

  const automations = await db.query(
    `select automation_key, label, status, metadata
     from quote_workbook_automations
     where workbook_id = $1
     order by id`,
    [workbookId]
  );

  const templateResult = await db.query(
    `insert into quote_templates (template_name, description, source_workbook_id, status, is_default)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [workbook.original_filename.replace(/\.[^.]+$/, ''), 'Editable template created from uploaded quote workbook metadata.', workbookId, 'draft', false]
  );
  const template = templateResult.rows[0];

  const versionResult = await db.query(
    `insert into quote_template_versions (template_id, version_number, status, metadata, field_map, range_map, formula_map, automation_map, defaults)
     values ($1, 1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      template.id,
      'draft',
      workbook.summary || {},
      fields.rows,
      ranges.rows,
      formulas.rows,
      automations.rows,
      {
        pricingMode: 'workbook_metadata',
        allowCustomerOverride: true,
        allowFormulaOverride: true,
        allowAutomationOverride: true,
        allowRangeOverride: true,
        sourceWorkbookId: workbookId
      }
    ]
  );
  const version = versionResult.rows[0];

  const defaultOverrides = [
    ['pricing', 'local_tax_rate', 'Local Tax Rate', { editable: true, valueType: 'percent', sourceField: 'local_tax_rate' }, 10],
    ['pricing', 'base_markup_rate', 'Base Markup Rate', { editable: true, valueType: 'percent', sourceRange: 'base_cost_rows' }, 20],
    ['pricing', 'alternate_markup_rate', 'Alternate Markup Rate', { editable: true, valueType: 'percent', sourceRange: 'alternate_rows' }, 30],
    ['pricing', 'labor_rate', 'Labor Rate', { editable: true, valueType: 'money', sourceField: 'fe_labor' }, 40],
    ['workflow', 'require_estimate_approval', 'Require Estimate Approval', { editable: true, valueType: 'boolean', defaultValue: true }, 50],
    ['workflow', 'auto_create_project_checklist', 'Auto-create Project Checklist', { editable: true, valueType: 'boolean', defaultValue: true }, 60],
    ['workflow', 'auto_create_sov_invoice', 'Auto-create SOV and Invoice Draws', { editable: true, valueType: 'boolean', defaultValue: true }, 70],
    ['handoff', 'approved_quote_to_projects', 'Approved Quote to Projects', { editable: true, valueType: 'boolean', defaultValue: true }, 80],
    ['handoff', 'approved_quote_to_accounting', 'Approved Quote to Accounting', { editable: true, valueType: 'boolean', defaultValue: true }, 90],
    ['handoff', 'approved_quote_to_purchasing', 'Approved Quote to Purchasing', { editable: true, valueType: 'boolean', defaultValue: false }, 100]
  ];

  for (const [type, key, label, value, sort] of defaultOverrides) {
    await db.query(
      `insert into quote_template_overrides (template_version_id, override_type, override_key, label, value, sort_order)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (template_version_id, override_type, override_key)
       do update set label = excluded.label, value = excluded.value, sort_order = excluded.sort_order, updated_at = now()`,
      [version.id, type, key, label, value, sort]
    );
  }

  await db.query(
    `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5)`,
    [actor, 'quote_template_created_from_workbook_metadata', 'quote_template', String(template.id), { workbookId, templateVersionId: version.id }]
  );

  return getTemplate(db, template.id);
}

export async function listTemplates(db) {
  await ensureQuoteTemplateSchema(db);
  const result = await db.query(`
    select qt.*, qtv.id as current_version_id, qtv.version_number, qtv.status as version_status
    from quote_templates qt
    left join lateral (
      select * from quote_template_versions
      where template_id = qt.id
      order by version_number desc
      limit 1
    ) qtv on true
    order by qt.updated_at desc, qt.created_at desc
  `);
  return result.rows;
}

export async function getTemplate(db, templateId) {
  await ensureQuoteTemplateSchema(db);
  const templateResult = await db.query('select * from quote_templates where id = $1', [templateId]);
  const template = templateResult.rows[0];
  if (!template) return null;

  const versions = await db.query('select * from quote_template_versions where template_id = $1 order by version_number desc', [templateId]);
  const currentVersion = versions.rows[0] || null;
  const overrides = currentVersion
    ? await db.query('select * from quote_template_overrides where template_version_id = $1 order by sort_order, id', [currentVersion.id])
    : { rows: [] };

  return { template, versions: versions.rows, currentVersion, overrides: overrides.rows };
}

export async function updateTemplateVersion(db, versionId, patch, actor = 'estimating') {
  await ensureQuoteTemplateSchema(db);
  const allowed = ['metadata', 'field_map', 'range_map', 'formula_map', 'automation_map', 'defaults', 'status'];
  const existing = await db.query('select * from quote_template_versions where id = $1', [versionId]);
  if (!existing.rows[0]) {
    const error = new Error('Quote template version not found.');
    error.statusCode = 404;
    throw error;
  }

  const next = { ...existing.rows[0] };
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = patch[key];
  }

  const result = await db.query(
    `update quote_template_versions
     set status = $2, metadata = $3, field_map = $4, range_map = $5, formula_map = $6, automation_map = $7, defaults = $8, updated_at = now()
     where id = $1
     returning *`,
    [versionId, next.status, next.metadata, next.field_map, next.range_map, next.formula_map, next.automation_map, next.defaults]
  );

  await db.query(
    `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5)`,
    [actor, 'quote_template_version_updated', 'quote_template_version', String(versionId), { keys: Object.keys(patch) }]
  );

  return result.rows[0];
}

export async function upsertTemplateOverride(db, versionId, override, actor = 'estimating') {
  await ensureQuoteTemplateSchema(db);
  const result = await db.query(
    `insert into quote_template_overrides (template_version_id, override_type, override_key, label, value, is_enabled, sort_order)
     values ($1, $2, $3, $4, $5, coalesce($6, true), coalesce($7, 0))
     on conflict (template_version_id, override_type, override_key)
     do update set label = excluded.label, value = excluded.value, is_enabled = excluded.is_enabled, sort_order = excluded.sort_order, updated_at = now()
     returning *`,
    [versionId, override.overrideType, override.overrideKey, override.label || override.overrideKey, override.value || {}, override.isEnabled, override.sortOrder]
  );

  await db.query(
    `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5)`,
    [actor, 'quote_template_override_upserted', 'quote_template_override', String(result.rows[0].id), { versionId }]
  );

  return result.rows[0];
}
