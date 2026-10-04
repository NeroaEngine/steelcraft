import express from 'express';
import { Pool } from 'pg';

function getDatabaseConfig() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  return {
    connectionString: url.toString(),
    ssl: sslmode && sslmode !== 'disable' ? { rejectUnauthorized: false } : false
  };
}

const dbConfig = getDatabaseConfig();
const pool = dbConfig ? new Pool(dbConfig) : null;

function requireDatabase() {
  if (!pool) {
    const error = new Error('DATABASE_URL is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return pool;
}

function tenantKey(req) {
  return req.params.tenantKey || req.query.tenantKey || req.body?.tenantKey || req.body?.tenant_id || req.body?.tenantId || process.env.STEELCRAFT_TENANT_KEY || 'steelcraft';
}

function clean(value = '') {
  return String(value ?? '').trim();
}

function key(value = '') {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pick(row, names) {
  const entries = Object.entries(row || {}).map(([sourceKey, value]) => [key(sourceKey), value]);
  for (const name of names) {
    const found = entries.find(([sourceKey]) => sourceKey === key(name));
    if (found && clean(found[1])) return clean(found[1]);
  }
  return '';
}

function splitName(fullName) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function sourceId(prefix, fileName, rowIndex, fallback) {
  return `${prefix}:${clean(fileName) || 'upload'}:${rowIndex + 1}:${key(fallback) || 'row'}`.slice(0, 240);
}

async function ensureTables(db) {
  await db.query(`
    create table if not exists steelcraft_crm_accounts (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      account_name text not null,
      account_type text,
      industry text,
      website text,
      main_email text,
      main_phone text,
      billing_email text,
      billing_phone text,
      address_line1 text,
      address_line2 text,
      city text,
      state text,
      postal_code text,
      status text not null default 'active',
      notes text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists steelcraft_crm_contacts (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      account_id bigint references steelcraft_crm_accounts(id) on delete set null,
      full_name text not null,
      first_name text,
      last_name text,
      contact_type text,
      title text,
      company_name text,
      email text,
      phone text,
      mobile text,
      website text,
      address_line1 text,
      address_line2 text,
      city text,
      state text,
      postal_code text,
      status text not null default 'active',
      notes text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists steelcraft_crm_account_contacts (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      account_id bigint not null references steelcraft_crm_accounts(id) on delete cascade,
      contact_id bigint not null references steelcraft_crm_contacts(id) on delete cascade,
      relationship_type text default 'contact',
      is_primary boolean not null default false,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_key, account_id, contact_id, relationship_type)
    );

    create table if not exists project_delivery (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      project_name text not null,
      manufacturer text not null default '',
      mbs_job_number text not null default '',
      engineering_status text not null default '',
      drawing_stage text not null default '',
      production_status text not null default '',
      delivery_date text not null default '',
      project_manager text not null default '',
      notes text not null default '',
      source_file text not null default '',
      source_row integer not null default 0,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists erection_schedule (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      project_name text not null,
      delivery_date text not null default '',
      erection_start_date text not null default '',
      crew text not null default '',
      superintendent text not null default '',
      percent_complete text not null default '',
      status text not null default '',
      notes text not null default '',
      source_file text not null default '',
      source_row integer not null default 0,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists idx_scb_accounts_tenant_name on steelcraft_crm_accounts (tenant_key, lower(account_name));
    create index if not exists idx_scb_contacts_tenant_email on steelcraft_crm_contacts (tenant_key, lower(email));
  `);
}

async function upsertAccount(db, tenantId, row, fileName, index) {
  const accountName = pick(row, ['Account Name', 'Account', 'Company', 'Customer', 'Organization', 'Name']);
  if (!accountName) return null;
  const uiId = sourceId('spreadsheet-account', fileName, index, accountName);
  const existing = await db.query(
    `select id from steelcraft_crm_accounts where tenant_key = $1 and ((raw->>'uiId') = $2 or lower(account_name) = lower($3)) order by id limit 1`,
    [tenantId, uiId, accountName]
  );
  const values = [
    tenantId,
    accountName,
    pick(row, ['Account Type', 'Type', 'Category']),
    pick(row, ['Industry']),
    pick(row, ['Website', 'URL', 'Domain']),
    pick(row, ['Email', 'Main Email', 'Account Email']),
    pick(row, ['Phone', 'Main Phone', 'Phone Number']),
    pick(row, ['Billing Email']),
    pick(row, ['Billing Phone']),
    pick(row, ['Address', 'Address Line 1', 'Billing Address']),
    pick(row, ['Address Line 2']),
    pick(row, ['City']),
    pick(row, ['State']),
    pick(row, ['Zip', 'Postal Code']),
    pick(row, ['Status']) || 'active',
    pick(row, ['Notes', 'Comments', 'Description']),
    { ...row, uiId, sourceFile: fileName, sourceRow: index + 1 }
  ];
  if (existing.rows[0]) {
    const result = await db.query(
      `update steelcraft_crm_accounts set account_name=$2, account_type=$3, industry=$4, website=$5, main_email=$6, main_phone=$7, billing_email=$8, billing_phone=$9, address_line1=$10, address_line2=$11, city=$12, state=$13, postal_code=$14, status=$15, notes=$16, raw=$17::jsonb, updated_at=now() where tenant_key=$1 and id=$18 returning *`,
      [...values, existing.rows[0].id]
    );
    return result.rows[0];
  }
  const result = await db.query(
    `insert into steelcraft_crm_accounts (tenant_key, account_name, account_type, industry, website, main_email, main_phone, billing_email, billing_phone, address_line1, address_line2, city, state, postal_code, status, notes, raw) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb) returning *`,
    values
  );
  return result.rows[0];
}

async function importAccounts(db, tenantId, rows, fileName) {
  let imported = 0;
  let skipped = 0;
  const errors = [];
  for (let index = 0; index < rows.length; index += 1) {
    const saved = await upsertAccount(db, tenantId, rows[index], fileName, index);
    if (saved) imported += 1;
    else { skipped += 1; errors.push(`Row ${index + 1}: missing account/company name`); }
  }
  return { imported, skipped, errors };
}

async function importContacts(db, tenantId, rows, fileName) {
  await importAccounts(db, tenantId, rows, fileName);
  let imported = 0;
  let skipped = 0;
  let matched = 0;
  let unmatched = 0;
  const errors = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const fullName = pick(row, ['Full Name', 'Name', 'Contact', 'Contact Name', 'Person']);
    const email = pick(row, ['Email', 'Email Address', 'E-mail']);
    const phone = pick(row, ['Phone', 'Phone Number', 'Mobile', 'Cell']);
    const company = pick(row, ['Company', 'Account', 'Customer', 'Organization', 'Linked Account']);
    if (!fullName && !email) { skipped += 1; errors.push(`Row ${index + 1}: missing contact name/email`); continue; }
    const name = fullName || email;
    const { firstName, lastName } = splitName(name);
    const accountResult = company ? await db.query('select id from steelcraft_crm_accounts where tenant_key = $1 and lower(account_name) = lower($2) order by id limit 1', [tenantId, company]) : { rows: [] };
    const accountId = accountResult.rows[0]?.id || null;
    if (accountId) matched += 1; else unmatched += 1;
    const uiId = sourceId('spreadsheet-contact', fileName, index, email || name);
    const existing = await db.query(
      `select id from steelcraft_crm_contacts where tenant_key = $1 and ((raw->>'uiId') = $2 or ($3::text <> '' and lower(email) = lower($3)) or lower(full_name) = lower($4)) order by id limit 1`,
      [tenantId, uiId, email, name]
    );
    const values = [tenantId, accountId, name, firstName, lastName, pick(row, ['Contact Type', 'Type']), pick(row, ['Title', 'Job Title', 'Role']), company, email, phone, pick(row, ['Mobile', 'Cell']), pick(row, ['Website', 'URL']), pick(row, ['Address', 'Address Line 1']), pick(row, ['Address Line 2']), pick(row, ['City']), pick(row, ['State']), pick(row, ['Zip', 'Postal Code']), pick(row, ['Status']) || 'active', pick(row, ['Notes', 'Comments']), { ...row, uiId, sourceFile: fileName, sourceRow: index + 1 }];
    let contact;
    if (existing.rows[0]) {
      const result = await db.query(
        `update steelcraft_crm_contacts set account_id=$2, full_name=$3, first_name=$4, last_name=$5, contact_type=$6, title=$7, company_name=$8, email=$9, phone=$10, mobile=$11, website=$12, address_line1=$13, address_line2=$14, city=$15, state=$16, postal_code=$17, status=$18, notes=$19, raw=$20::jsonb, updated_at=now() where tenant_key=$1 and id=$21 returning *`,
        [...values, existing.rows[0].id]
      );
      contact = result.rows[0];
    } else {
      const result = await db.query(
        `insert into steelcraft_crm_contacts (tenant_key, account_id, full_name, first_name, last_name, contact_type, title, company_name, email, phone, mobile, website, address_line1, address_line2, city, state, postal_code, status, notes, raw) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb) returning *`,
        values
      );
      contact = result.rows[0];
    }
    if (accountId) {
      await db.query(
        `insert into steelcraft_crm_account_contacts (tenant_key, account_id, contact_id, relationship_type, is_primary, raw) values ($1,$2,$3,'contact',false,$4::jsonb) on conflict (tenant_key, account_id, contact_id, relationship_type) do update set raw=excluded.raw, updated_at=now()`,
        [tenantId, accountId, contact.id, { source: 'spreadsheet_import', uiId }]
      );
    }
    imported += 1;
  }
  return { imported, skipped, matched, unmatched, errors };
}

async function importProjectDelivery(db, tenantId, rows, fileName) {
  let imported = 0;
  let skipped = 0;
  const errors = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const projectName = pick(row, ['Project Name', 'Project', 'Job Name', 'Job', 'Name']);
    if (!projectName) { skipped += 1; errors.push(`Row ${index + 1}: missing project name`); continue; }
    await db.query(
      `insert into project_delivery (tenant_key, project_name, manufacturer, mbs_job_number, engineering_status, drawing_stage, production_status, delivery_date, project_manager, notes, source_file, source_row, raw, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,now())`,
      [tenantId, projectName, pick(row, ['Manufacturer', 'Vendor']), pick(row, ['MBS Job Number', 'MBS Job #', 'Manufacturer Job Number']), pick(row, ['Engineering Status', 'Engineering']), pick(row, ['Drawing Stage', 'Drawings']), pick(row, ['Production Status', 'Production']), pick(row, ['Delivery Date', 'Building Delivery Date']), pick(row, ['Project Manager', 'PM']), pick(row, ['Notes', 'Comments']), fileName, index + 1, row]
    );
    imported += 1;
  }
  return { imported, skipped, errors };
}

async function importErectionSchedule(db, tenantId, rows, fileName) {
  let imported = 0;
  let skipped = 0;
  const errors = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const projectName = pick(row, ['Project Name', 'Project', 'Job Name', 'Job', 'Name']);
    if (!projectName) { skipped += 1; errors.push(`Row ${index + 1}: missing project name`); continue; }
    await db.query(
      `insert into erection_schedule (tenant_key, project_name, delivery_date, erection_start_date, crew, superintendent, percent_complete, status, notes, source_file, source_row, raw, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,now())`,
      [tenantId, projectName, pick(row, ['Delivery Date', 'Building Delivery Date']), pick(row, ['Erection Start Date', 'Erection Start', 'Start Date']), pick(row, ['Crew', 'Crew Assignment', 'Subcontractor']), pick(row, ['Superintendent', 'Super']), pick(row, ['Percent Complete', '% Complete', 'Complete']), pick(row, ['Status', 'Erection Status']), pick(row, ['Notes', 'Comments']), fileName, index + 1, row]
    );
    imported += 1;
  }
  return { imported, skipped, errors };
}

function registerSteelcraftDataImportRoutes(app) {
  if (app.__steelcraftDataImportRoutesRegistered) return;
  app.__steelcraftDataImportRoutesRegistered = true;

  app.post('/api/data-import/:kind', express.json({ limit: '50mb' }), async (req, res, next) => {
    try {
      const kind = String(req.params.kind || '').trim();
      const fileName = clean(req.body?.fileName || 'spreadsheet-upload');
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      if (!rows.length) return res.status(400).json({ ok: false, error: 'No rows were provided for import.' });

      const db = requireDatabase();
      const tenantId = tenantKey(req);
      await ensureTables(db);

      let result;
      if (kind === 'contacts') result = await importContacts(db, tenantId, rows, fileName);
      else if (kind === 'accounts') result = await importAccounts(db, tenantId, rows, fileName);
      else if (kind === 'project-delivery') result = await importProjectDelivery(db, tenantId, rows, fileName);
      else if (kind === 'erection-schedule') result = await importErectionSchedule(db, tenantId, rows, fileName);
      else return res.status(400).json({ ok: false, error: `Unsupported import kind: ${kind}` });

      res.json({ ok: true, kind, tenantId, fileName, rowsRead: rows.length, ...result, receipt: { id: `${kind}-${Date.now()}`, source: fileName, importedAt: new Date().toISOString() } });
    } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftDataImportAutoRegister) {
  express.application.listen = function patchedSteelcraftDataImportListen(...args) {
    registerSteelcraftDataImportRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__steelcraftDataImportAutoRegister', { value: true });
}
