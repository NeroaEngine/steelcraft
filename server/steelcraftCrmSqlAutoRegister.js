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

function cleanText(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function accountName(row) {
  return cleanText(row?.name || row?.account_name || row?.accountName || row?.company || row?.company_name) || 'Unnamed Account';
}

function contactName(row) {
  return cleanText(row?.name || row?.full_name || row?.fullName || [row?.first_name || row?.firstName, row?.last_name || row?.lastName].filter(Boolean).join(' ')) || 'Unnamed Contact';
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || null, lastName: null };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1)[0] };
}

async function ensureCrmTables(db) {
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

    create table if not exists steelcraft_audit_log (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft',
      actor text,
      action text not null,
      entity_table text,
      entity_id text,
      before_data jsonb,
      after_data jsonb,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_scb_accounts_raw_ui_id on steelcraft_crm_accounts ((raw->>'uiId'));
    create index if not exists idx_scb_contacts_raw_ui_id on steelcraft_crm_contacts ((raw->>'uiId'));
    create index if not exists idx_scb_accounts_tenant_name on steelcraft_crm_accounts (tenant_key, lower(account_name));
    create index if not exists idx_scb_contacts_tenant_name on steelcraft_crm_contacts (tenant_key, lower(full_name));
    create index if not exists idx_scb_contacts_tenant_email on steelcraft_crm_contacts (tenant_key, lower(email));
  `);
}

async function upsertAccount(db, tenantId, account) {
  const name = accountName(account);
  const uiId = cleanText(account?.id || account?.uiId || account?.itemId);
  const raw = { ...account, uiId };

  const existing = await db.query(
    `select id from steelcraft_crm_accounts
     where tenant_key = $1
       and (($2::text is not null and raw->>'uiId' = $2) or lower(account_name) = lower($3))
     order by case when raw->>'uiId' = $2 then 0 else 1 end, id
     limit 1`,
    [tenantId, uiId, name]
  );

  const values = [
    tenantId,
    name,
    cleanText(account?.type || account?.account_type || account?.accountType),
    cleanText(account?.industry),
    cleanText(account?.domain || account?.website || account?.url),
    cleanText(account?.accountEmail || account?.main_email || account?.email),
    cleanText(account?.main_phone || account?.phone),
    cleanText(account?.billing_email || account?.billingEmail),
    cleanText(account?.billing_phone || account?.billingPhone),
    cleanText(account?.address_line1 || account?.addressLine1 || account?.address),
    cleanText(account?.address_line2 || account?.addressLine2),
    cleanText(account?.city),
    cleanText(account?.state),
    cleanText(account?.postal_code || account?.postalCode || account?.zip),
    cleanText(account?.status) || 'active',
    cleanText(account?.notes),
    raw
  ];

  if (existing.rows[0]) {
    const result = await db.query(
      `update steelcraft_crm_accounts set
        account_name = $2, account_type = $3, industry = $4, website = $5, main_email = $6, main_phone = $7,
        billing_email = $8, billing_phone = $9, address_line1 = $10, address_line2 = $11, city = $12, state = $13,
        postal_code = $14, status = $15, notes = $16, raw = $17::jsonb, updated_at = now()
       where tenant_key = $1 and id = $18
       returning *`,
      [...values, existing.rows[0].id]
    );
    return result.rows[0];
  }

  const result = await db.query(
    `insert into steelcraft_crm_accounts
      (tenant_key, account_name, account_type, industry, website, main_email, main_phone, billing_email, billing_phone, address_line1, address_line2, city, state, postal_code, status, notes, raw)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
     returning *`,
    values
  );
  return result.rows[0];
}

async function upsertContact(db, tenantId, contact, accountMap = new Map()) {
  const fullName = contactName(contact);
  const { firstName, lastName } = splitName(fullName);
  const uiId = cleanText(contact?.id || contact?.uiId || contact?.itemId);
  const accountUiId = cleanText(contact?.accountId || contact?.account_id);
  const linkedAccount = cleanText(contact?.linkedAccount || contact?.company_name || contact?.companyName || contact?.company);
  let accountId = accountUiId ? accountMap.get(accountUiId) : null;

  if (!accountId && linkedAccount) {
    const accountResult = await db.query('select id from steelcraft_crm_accounts where tenant_key = $1 and lower(account_name) = lower($2) order by id limit 1', [tenantId, linkedAccount]);
    accountId = accountResult.rows[0]?.id || null;
  }

  const raw = { ...contact, uiId };
  const email = cleanText(contact?.email);
  const existing = await db.query(
    `select id from steelcraft_crm_contacts
     where tenant_key = $1
       and (($2::text is not null and raw->>'uiId' = $2)
         or ($3::text is not null and lower(email) = lower($3))
         or lower(full_name) = lower($4))
     order by case when raw->>'uiId' = $2 then 0 when lower(email) = lower(coalesce($3,'')) then 1 else 2 end, id
     limit 1`,
    [tenantId, uiId, email, fullName]
  );

  const values = [
    tenantId,
    accountId,
    fullName,
    cleanText(contact?.firstName || contact?.first_name) || firstName,
    cleanText(contact?.lastName || contact?.last_name) || lastName,
    cleanText(contact?.type || contact?.contact_type || contact?.contactType),
    cleanText(contact?.title),
    linkedAccount,
    email,
    cleanText(contact?.phone),
    cleanText(contact?.mobile),
    cleanText(contact?.url || contact?.website),
    cleanText(contact?.address_line1 || contact?.addressLine1 || contact?.address),
    cleanText(contact?.address_line2 || contact?.addressLine2),
    cleanText(contact?.city),
    cleanText(contact?.state),
    cleanText(contact?.postal_code || contact?.postalCode || contact?.zip),
    cleanText(contact?.status) || 'active',
    cleanText(contact?.notes),
    raw
  ];

  let saved;
  if (existing.rows[0]) {
    const result = await db.query(
      `update steelcraft_crm_contacts set
        account_id = $2, full_name = $3, first_name = $4, last_name = $5, contact_type = $6, title = $7, company_name = $8,
        email = $9, phone = $10, mobile = $11, website = $12, address_line1 = $13, address_line2 = $14, city = $15,
        state = $16, postal_code = $17, status = $18, notes = $19, raw = $20::jsonb, updated_at = now()
       where tenant_key = $1 and id = $21
       returning *`,
      [...values, existing.rows[0].id]
    );
    saved = result.rows[0];
  } else {
    const result = await db.query(
      `insert into steelcraft_crm_contacts
        (tenant_key, account_id, full_name, first_name, last_name, contact_type, title, company_name, email, phone, mobile, website, address_line1, address_line2, city, state, postal_code, status, notes, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb)
       returning *`,
      values
    );
    saved = result.rows[0];
  }

  if (saved.account_id) {
    await db.query(
      `insert into steelcraft_crm_account_contacts (tenant_key, account_id, contact_id, relationship_type, is_primary, raw)
       values ($1,$2,$3,'contact',false,$4::jsonb)
       on conflict (tenant_key, account_id, contact_id, relationship_type) do update set raw = excluded.raw, updated_at = now()`,
      [tenantId, saved.account_id, saved.id, { source: 'crm_sql_sync', uiId }]
    );
  }

  return saved;
}

function accountToUi(row, linkedContacts = []) {
  const raw = row.raw || {};
  return {
    ...raw,
    id: raw.uiId || raw.id || `sql-acc-${row.id}`,
    name: row.account_name,
    type: row.account_type || raw.type || '',
    domain: row.website || raw.domain || '',
    industry: row.industry || raw.industry || '',
    contacts: linkedContacts,
    accountEmail: row.main_email || raw.accountEmail || '',
    notes: row.notes || raw.notes || '',
    itemId: raw.itemId || String(row.id),
    sqlId: row.id
  };
}

function contactToUi(row) {
  const raw = row.raw || {};
  return {
    ...raw,
    id: raw.uiId || raw.id || `sql-con-${row.id}`,
    name: row.full_name,
    type: row.contact_type || raw.type || '',
    accountId: row.account_ui_id || raw.accountId || (row.account_id ? `sql-acc-${row.account_id}` : ''),
    linkedAccount: row.account_name || row.company_name || raw.linkedAccount || '',
    title: row.title || raw.title || '',
    phone: row.phone || raw.phone || '',
    email: row.email || raw.email || '',
    url: row.website || raw.url || '',
    notes: row.notes || raw.notes || '',
    itemId: raw.itemId || String(row.id),
    sqlId: row.id
  };
}

async function getCrmRecords(db, tenantId) {
  await ensureCrmTables(db);
  const accountsResult = await db.query('select * from steelcraft_crm_accounts where tenant_key = $1 order by lower(account_name), id', [tenantId]);
  const contactsResult = await db.query(`
    select c.*, a.account_name, a.raw->>'uiId' as account_ui_id
    from steelcraft_crm_contacts c
    left join steelcraft_crm_accounts a on a.id = c.account_id
    where c.tenant_key = $1
    order by lower(c.full_name), c.id
  `, [tenantId]);

  const contactsByAccount = new Map();
  for (const contact of contactsResult.rows) {
    if (!contact.account_id) continue;
    const list = contactsByAccount.get(contact.account_id) || [];
    list.push(contact.full_name);
    contactsByAccount.set(contact.account_id, list);
  }

  return {
    tenantId,
    accounts: accountsResult.rows.map((row) => accountToUi(row, contactsByAccount.get(row.id) || [])),
    contacts: contactsResult.rows.map(contactToUi),
    counts: { accounts: accountsResult.rowCount, contacts: contactsResult.rowCount },
    source: 'steelcraft_sql',
    generatedAt: new Date().toISOString()
  };
}

async function importCrmRecords(db, tenantId, payload) {
  await ensureCrmTables(db);
  const accounts = Array.isArray(payload?.accounts) ? payload.accounts : [];
  const contacts = Array.isArray(payload?.contacts) ? payload.contacts : [];
  const accountMap = new Map();
  let accountCount = 0;
  let contactCount = 0;

  await db.query('begin');
  try {
    for (const account of accounts) {
      const saved = await upsertAccount(db, tenantId, account);
      accountCount += 1;
      const uiId = cleanText(account?.id || account?.uiId || account?.itemId);
      if (uiId) accountMap.set(uiId, saved.id);
    }
    for (const contact of contacts) {
      await upsertContact(db, tenantId, contact, accountMap);
      contactCount += 1;
    }
    await db.query(
      `insert into steelcraft_audit_log (tenant_key, actor, action, entity_table, metadata)
       values ($1,$2,'crm_sql_sync','steelcraft_crm_contacts',$3::jsonb)`,
      [tenantId, payload?.actor || 'crm_sql_bridge', { accountCount, contactCount, source: payload?.source || 'unknown' }]
    );
    await db.query('commit');
  } catch (error) {
    await db.query('rollback');
    throw error;
  }

  return { accountCount, contactCount, ...(await getCrmRecords(db, tenantId)) };
}

function registerSteelcraftCrmSqlRoutes(app) {
  if (app.__steelcraftCrmSqlRoutesRegistered) return;
  app.__steelcraftCrmSqlRoutesRegistered = true;

  app.get('/api/steelcraft/crm/records', async (req, res, next) => {
    try {
      res.json({ ok: true, ...(await getCrmRecords(requireDatabase(), tenantKey(req))) });
    } catch (error) { next(error); }
  });

  app.post('/api/steelcraft/crm/records', express.json({ limit: '20mb' }), async (req, res, next) => {
    try {
      res.json({ ok: true, synced: true, ...(await importCrmRecords(requireDatabase(), tenantKey(req), req.body || {})) });
    } catch (error) { next(error); }
  });

  app.get('/api/steelcraft/crm/accounts', async (req, res, next) => {
    try {
      const records = await getCrmRecords(requireDatabase(), tenantKey(req));
      res.json({ ok: true, tenantId: records.tenantId, accounts: records.accounts, count: records.accounts.length });
    } catch (error) { next(error); }
  });

  app.get('/api/steelcraft/crm/contacts', async (req, res, next) => {
    try {
      const records = await getCrmRecords(requireDatabase(), tenantKey(req));
      res.json({ ok: true, tenantId: records.tenantId, contacts: records.contacts, count: records.contacts.length });
    } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftCrmSqlAutoRegister) {
  express.application.listen = function patchedSteelcraftCrmSqlListen(...args) {
    registerSteelcraftCrmSqlRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__steelcraftCrmSqlAutoRegister', { value: true });
}
