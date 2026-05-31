import crypto from 'node:crypto';

const DEFAULT_BUSINESS_DISPLAY_ID = 'BUSV321684';
const DEFAULT_FIRST_USER_SUFFIX = '100001';

export const ROLE_CLASS = {
  SUPER_ADMIN: '10',
  ADMIN: '11',
  DEVELOPER: '12',
  ANALYST: '13',
  USER: '14',
  SERVICE: '15'
};

export const ROLE_CLASS_BY_ERP_ROLE = {
  admin: ROLE_CLASS.SUPER_ADMIN,
  accounting: ROLE_CLASS.ADMIN,
  developer: ROLE_CLASS.DEVELOPER,
  employee: ROLE_CLASS.USER,
  vendor: ROLE_CLASS.SERVICE,
  customer: ROLE_CLASS.USER
};

const DEFAULT_BUSINESS_PERMISSIONS = [
  'erp.login',
  'erp.audit.view',
  'erp.profile.manage',
  'erp.portal.assign',
  'erp.vault.capture',
  'erp.guard.receipt.create',
  'erp.scan.event.create',
  'mail.account.create',
  'mail.account.manage',
  'mail.domain.add',
  'mail.domain.verify',
  'mail.mailbox.create',
  'mail.mailbox.assign',
  'mail.mailbox.manage',
  'mail.alias.create',
  'mail.send',
  'mail.receive',
  'mail.ai.use',
  'mail.ai.approve',
  'mail.export',
  'mail.audit.view'
];

export function normalizeBusinessAuthorityId(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  if (/^BUSV\d{3,}$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `BUSV${digits}` : raw;
}

function normalizeDigits(value, fallback = '321684') {
  const digits = String(value || '').replace(/\D/g, '');
  return digits || fallback;
}

function authorityDisplayId(inputDisplayId = null) {
  return normalizeBusinessAuthorityId(inputDisplayId || process.env.BOOTSTRAP_BUSINESS_AUTHORITY_ID || process.env.AUTHORITY_BUSINESS_ID || DEFAULT_BUSINESS_DISPLAY_ID);
}

function authorityUserDisplayId(accountDisplayId, roleClass = ROLE_CLASS.SUPER_ADMIN, inputDisplayId = null) {
  if (inputDisplayId) return String(inputDisplayId).trim().toUpperCase();
  const digits = normalizeDigits(accountDisplayId);
  const suffix = process.env.BOOTSTRAP_AUTHORITY_USER_SUFFIX || DEFAULT_FIRST_USER_SUFFIX;
  return process.env.BOOTSTRAP_AUTHORITY_USER_ID || `${accountDisplayId}_US${digits}${roleClass}${suffix}`;
}

function vaultLineageId(displayId, actionType) {
  const hash = crypto.createHash('sha256').update(`${displayId}:${actionType}:${Date.now()}`).digest('hex').slice(0, 24);
  return `vault:${hash}`;
}

function guardReceiptId(displayId, actionType) {
  const hash = crypto.createHash('sha256').update(`guard:${displayId}:${actionType}:${Date.now()}`).digest('hex').slice(0, 24);
  return `guard:${hash}`;
}

export async function ensureAuthoritySchema(db) {
  await db.query(`create extension if not exists pgcrypto;`);
  await db.query(`
    create table if not exists authority_accounts (
      id uuid primary key default gen_random_uuid(),
      authority_type text not null check (authority_type in ('business')),
      display_id text not null unique,
      legal_name text not null,
      tenant_key text,
      status text not null default 'active' check (status in ('pending_setup','active','suspended','closed')),
      vault_root_id text,
      guard_policy_id text,
      scan_root_id text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists authority_users (
      id uuid primary key default gen_random_uuid(),
      authority_account_id uuid not null references authority_accounts(id) on delete cascade,
      display_id text not null unique,
      email text not null,
      full_name text not null,
      role_class text not null check (role_class in ('10','11','12','13','14','15')),
      role_label text not null,
      status text not null default 'active' check (status in ('pending','active','disabled','closed')),
      permissions jsonb not null default '[]'::jsonb,
      vault_capture_enabled boolean not null default true,
      guard_receipts_enabled boolean not null default true,
      scan_receipts_enabled boolean not null default true,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (authority_account_id, email)
    );

    create table if not exists authority_action_events (
      id uuid primary key default gen_random_uuid(),
      authority_account_id uuid not null references authority_accounts(id) on delete cascade,
      authority_user_id uuid references authority_users(id),
      authority_display_id text not null,
      authority_user_display_id text,
      role_class_at_time text check (role_class_at_time in ('10','11','12','13','14','15')),
      action_type text not null,
      action_scope text not null default 'erp',
      approval_required boolean not null default false,
      approved_by_authority_user_id uuid references authority_users(id),
      vault_lineage_id text,
      guard_receipt_id text,
      scan_event_id text,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists vault_memory_refs (
      id uuid primary key default gen_random_uuid(),
      authority_account_id uuid not null references authority_accounts(id) on delete cascade,
      authority_user_id uuid references authority_users(id),
      source_service text not null default 'erp',
      source_table text,
      source_record_id text,
      memory_type text not null default 'activity',
      vault_lineage_id text not null,
      guard_receipt_id text,
      scan_event_id text,
      payload_hash text,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      unique (vault_lineage_id)
    );
  `);
}

export async function findBusinessAuthority(db, businessAuthorityId) {
  await ensureAuthoritySchema(db);
  const displayId = normalizeBusinessAuthorityId(businessAuthorityId);
  if (!displayId) return null;
  const result = await db.query('select * from authority_accounts where authority_type = $1 and display_id = $2 limit 1', ['business', displayId]);
  return result.rows[0] || null;
}

export async function resolveOrCreateBusinessAuthority(db, { existingBusinessAuthorityId = null, hasExistingBusinessAuthority = false, legalName, tenantKey = 'steelcraft', raw = {} } = {}) {
  await ensureAuthoritySchema(db);
  const displayId = authorityDisplayId(hasExistingBusinessAuthority ? existingBusinessAuthorityId : null);
  if (hasExistingBusinessAuthority && !existingBusinessAuthorityId) {
    const error = new Error('BUSV number is required when the business already has an authority account.');
    error.statusCode = 400;
    throw error;
  }

  const accountResult = await db.query(
    `insert into authority_accounts (authority_type, display_id, legal_name, tenant_key, status, vault_root_id, guard_policy_id, scan_root_id, raw)
     values ('business', $1, $2, $3, 'active', $4, $5, $6, $7)
     on conflict (display_id)
     do update set legal_name = coalesce(nullif(excluded.legal_name, ''), authority_accounts.legal_name), tenant_key = coalesce(excluded.tenant_key, authority_accounts.tenant_key), updated_at = now()
     returning *`,
    [displayId, legalName || displayId, tenantKey, `vault:${displayId}`, `guard:${displayId}`, `scan:${displayId}`, { ...raw, provided_existing_busv: Boolean(hasExistingBusinessAuthority) }]
  );
  const authorityAccount = accountResult.rows[0];

  await recordAuthorityAction(db, {
    authorityAccount,
    actionType: hasExistingBusinessAuthority ? 'business_authority_resolved_for_erp' : 'business_authority_created_for_erp',
    metadata: { tenantKey, displayId, providedExistingBusv: Boolean(hasExistingBusinessAuthority), source_table: 'authority_accounts', source_record_id: String(authorityAccount.id) }
  });

  return authorityAccount;
}

export async function createOrResolveAuthorityUser(db, { authorityAccount, email, fullName, erpRole = 'employee', roleClass = null, authorityUserDisplayId: inputDisplayId = null, permissions = null, raw = {} } = {}) {
  await ensureAuthoritySchema(db);
  if (!authorityAccount?.id) throw new Error('authorityAccount is required.');
  if (!email) {
    const error = new Error('Email is required to create an ERP authority user.');
    error.statusCode = 400;
    throw error;
  }
  const resolvedRoleClass = roleClass || ROLE_CLASS_BY_ERP_ROLE[erpRole] || ROLE_CLASS.USER;
  const userDisplayId = authorityUserDisplayId(authorityAccount.display_id, resolvedRoleClass, inputDisplayId);
  const roleLabel = resolvedRoleClass === ROLE_CLASS.SUPER_ADMIN ? 'SUPER_ADMIN' : erpRole.toUpperCase();
  const grantedPermissions = permissions || (resolvedRoleClass === ROLE_CLASS.SUPER_ADMIN ? DEFAULT_BUSINESS_PERMISSIONS : ['erp.login', 'erp.vault.capture']);

  const result = await db.query(
    `insert into authority_users (authority_account_id, display_id, email, full_name, role_class, role_label, status, permissions, raw)
     values ($1,$2,$3,$4,$5,$6,'active',$7,$8)
     on conflict (display_id)
     do update set email = excluded.email, full_name = excluded.full_name, role_class = excluded.role_class, role_label = excluded.role_label, permissions = excluded.permissions, updated_at = now()
     returning *`,
    [authorityAccount.id, userDisplayId, email, fullName || email, resolvedRoleClass, roleLabel, JSON.stringify(grantedPermissions), raw]
  );
  const authorityUser = result.rows[0];

  await recordAuthorityAction(db, {
    authorityAccount,
    authorityUser,
    actionType: 'authority_user_resolved_for_erp_login',
    metadata: { email, erpRole, roleClass: resolvedRoleClass, source_table: 'authority_users', source_record_id: String(authorityUser.id) }
  });

  return authorityUser;
}

export async function ensureBootstrapBusinessAuthority(db, user = {}) {
  await ensureAuthoritySchema(db);
  const authorityAccount = await resolveOrCreateBusinessAuthority(db, {
    existingBusinessAuthorityId: process.env.BOOTSTRAP_BUSINESS_AUTHORITY_ID || process.env.AUTHORITY_BUSINESS_ID || DEFAULT_BUSINESS_DISPLAY_ID,
    hasExistingBusinessAuthority: Boolean(process.env.BOOTSTRAP_BUSINESS_AUTHORITY_ID || process.env.AUTHORITY_BUSINESS_ID),
    legalName: process.env.BOOTSTRAP_BUSINESS_NAME || process.env.BOOTSTRAP_COMPANY_NAME || 'Steel Craft',
    tenantKey: process.env.BOOTSTRAP_TENANT_KEY || process.env.STEELCRAFT_TENANT_KEY || 'steelcraft',
    raw: { source: 'bootstrap_business_authority' }
  });
  const authorityUser = await createOrResolveAuthorityUser(db, {
    authorityAccount,
    email: user.email,
    fullName: user.fullName || user.full_name || 'Tenant Admin',
    erpRole: user.role || 'admin',
    roleClass: ROLE_CLASS_BY_ERP_ROLE[user.role] || ROLE_CLASS.SUPER_ADMIN,
    authorityUserDisplayId: process.env.BOOTSTRAP_AUTHORITY_USER_ID,
    permissions: DEFAULT_BUSINESS_PERMISSIONS,
    raw: { source: 'bootstrap_erp_user' }
  });
  return { authorityAccount, authorityUser };
}

export async function recordAuthorityAction(db, { authorityAccount, authorityUser = null, actionType, actionScope = 'erp', metadata = {}, approvalRequired = false, approvedByAuthorityUserId = null }) {
  await ensureAuthoritySchema(db);
  const displayId = authorityAccount.display_id;
  const roleClass = authorityUser?.role_class || null;
  const lineageId = metadata.vault_lineage_id || vaultLineageId(displayId, actionType);
  const receiptId = metadata.guard_receipt_id || guardReceiptId(displayId, actionType);
  const scanId = metadata.scan_event_id || `scan:${crypto.createHash('sha256').update(`${receiptId}:${actionType}`).digest('hex').slice(0, 20)}`;

  const eventResult = await db.query(
    `insert into authority_action_events (authority_account_id, authority_user_id, authority_display_id, authority_user_display_id, role_class_at_time, action_type, action_scope, approval_required, approved_by_authority_user_id, vault_lineage_id, guard_receipt_id, scan_event_id, metadata_json)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning *`,
    [authorityAccount.id, authorityUser?.id || null, displayId, authorityUser?.display_id || null, roleClass, actionType, actionScope, approvalRequired, approvedByAuthorityUserId, lineageId, receiptId, scanId, metadata]
  );

  await db.query(
    `insert into vault_memory_refs (authority_account_id, authority_user_id, source_service, source_table, source_record_id, memory_type, vault_lineage_id, guard_receipt_id, scan_event_id, payload_hash, metadata_json)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (vault_lineage_id) do nothing`,
    [authorityAccount.id, authorityUser?.id || null, 'erp', metadata.source_table || null, metadata.source_record_id || null, metadata.memory_type || 'activity', lineageId, receiptId, scanId, crypto.createHash('sha256').update(JSON.stringify(metadata || {})).digest('hex'), metadata]
  );

  return eventResult.rows[0];
}

export async function resolveAuthorityByErpUser(db, erpUserId) {
  await ensureAuthoritySchema(db);
  const result = await db.query(
    `select eu.id as erp_user_id, eu.email, eu.full_name, eu.role, eu.authority_display_id, eu.authority_user_display_id,
            aa.id as authority_account_id, aa.display_id, aa.legal_name, aa.tenant_key,
            au.id as authority_user_id, au.role_class, au.permissions
     from erp_users eu
     left join authority_accounts aa on aa.id = eu.authority_account_id
     left join authority_users au on au.id = eu.authority_user_id
     where eu.id = $1`,
    [erpUserId]
  );
  return result.rows[0] || null;
}
