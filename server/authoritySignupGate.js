import crypto from 'node:crypto';
import { ROLE_CLASS, ROLE_CLASS_BY_ERP_ROLE, createOrResolveAuthorityUser, recordAuthorityAction } from './authoritySchema.js';

export const AUTHORITY_START_MODES = ['existing', 'new_personal', 'new_business'];
export const BUSINESS_JOIN_METHODS = ['invite_token', 'admin_approval', 'existing_assignment', 'super_admin_approval'];

export function normalizeAuthorityId(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (raw.startsWith('DUSB')) return `BUSV${raw.replace(/\D/g, '')}`;
  if (raw.startsWith('BUSV')) return `BUSV${raw.replace(/\D/g, '')}`;
  if (raw.startsWith('PRV')) return `PRV${raw.replace(/\D/g, '').padStart(9, '0').slice(-9)}`;
  return raw;
}

export function parseAuthorityId(value) {
  const displayId = normalizeAuthorityId(value);
  if (/^PRV\d{9}$/.test(displayId)) return { displayId, authorityType: 'personal' };
  if (/^BUSV\d{6}$/.test(displayId)) return { displayId, authorityType: 'business' };
  const error = new Error('Invalid authority number. Use PRV followed by 9 digits or BUSV followed by 6 digits. If speech-to-text entered DUSB, use BUSV.');
  error.statusCode = 400;
  throw error;
}

function createPrvDisplayId(seed = null) {
  if (seed) return parseAuthorityId(seed).displayId;
  const value = String(Math.floor(100000000 + Math.random() * 900000000));
  return `PRV${value}`;
}

function createBusvDisplayId(seed = null) {
  if (seed) return parseAuthorityId(seed).displayId;
  const value = String(Math.floor(100000 + Math.random() * 900000));
  return `BUSV${value}`;
}

function hashToken(token) {
  return token ? crypto.createHash('sha256').update(token).digest('hex') : null;
}

export async function ensureAuthoritySignupGateSchema(db) {
  await db.query(`create extension if not exists pgcrypto;`);
  await db.query(`
    do $$
    begin
      if exists (select 1 from information_schema.table_constraints where table_name = 'authority_accounts' and constraint_name = 'authority_accounts_authority_type_check') then
        alter table authority_accounts drop constraint authority_accounts_authority_type_check;
      end if;
      alter table authority_accounts add constraint authority_accounts_authority_type_check check (authority_type in ('personal','business'));
    exception when undefined_table then null;
    end $$;

    create table if not exists authority_join_requests (
      id uuid primary key default gen_random_uuid(),
      authority_account_id uuid not null references authority_accounts(id) on delete cascade,
      requested_by_email text not null,
      requested_full_name text,
      join_method text not null check (join_method in ('invite_token','admin_approval','existing_assignment','super_admin_approval')),
      status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
      invite_token_hash text,
      approved_by_authority_user_id uuid references authority_users(id),
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function findAuthorityByDisplayId(db, authorityId) {
  await ensureAuthoritySignupGateSchema(db);
  const parsed = parseAuthorityId(authorityId);
  const result = await db.query('select * from authority_accounts where display_id = $1 and authority_type = $2 limit 1', [parsed.displayId, parsed.authorityType]);
  return result.rows[0] || null;
}

export async function resolveExistingAuthorityForSignup(db, { existingAuthorityId, businessJoinMethod = null, inviteToken = null, email, fullName }) {
  const parsed = parseAuthorityId(existingAuthorityId);
  const authorityAccount = await findAuthorityByDisplayId(db, parsed.displayId);
  if (!authorityAccount) {
    const error = new Error(`${parsed.displayId} was not found in the authority registry. Create a new authority account or verify the number.`);
    error.statusCode = 404;
    throw error;
  }

  if (parsed.authorityType === 'business') {
    if (!BUSINESS_JOIN_METHODS.includes(businessJoinMethod)) {
      const error = new Error('BUSV join requires invite_token, admin_approval, existing_assignment, or super_admin_approval. BUSV number alone cannot grant access.');
      error.statusCode = 403;
      throw error;
    }
    const status = businessJoinMethod === 'admin_approval' ? 'pending' : 'approved';
    const joinResult = await db.query(
      `insert into authority_join_requests (authority_account_id, requested_by_email, requested_full_name, join_method, status, invite_token_hash, metadata_json)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning *`,
      [authorityAccount.id, email, fullName || email, businessJoinMethod, status, hashToken(inviteToken), { source: 'erp_existing_busv_signup_gate' }]
    );
    await recordAuthorityAction(db, {
      authorityAccount,
      actionType: 'business_authority_join_requested',
      approvalRequired: status === 'pending',
      metadata: { source_table: 'authority_join_requests', source_record_id: String(joinResult.rows[0].id), businessJoinMethod, requestedByEmail: email }
    });
    return { authorityAccount, authorityType: parsed.authorityType, joinRequest: joinResult.rows[0], approvedForImmediateLogin: status === 'approved' };
  }

  await recordAuthorityAction(db, {
    authorityAccount,
    actionType: 'personal_authority_attach_requested_for_erp',
    metadata: { email, fullName, source: 'erp_existing_prv_signup_gate' }
  });
  return { authorityAccount, authorityType: parsed.authorityType, joinRequest: null, approvedForImmediateLogin: true };
}

export async function createAuthorityForSignup(db, { mode, legalName, businessName, tenantKey = null }) {
  await ensureAuthoritySignupGateSchema(db);
  if (mode === 'new_personal') {
    const displayId = createPrvDisplayId(process.env.BOOTSTRAP_PERSONAL_AUTHORITY_ID);
    const result = await db.query(
      `insert into authority_accounts (authority_type, display_id, legal_name, tenant_key, status, vault_root_id, guard_policy_id, scan_root_id, raw)
       values ('personal',$1,$2,$3,'active',$4,$5,$6,$7)
       on conflict (display_id) do nothing
       returning *`,
      [displayId, legalName || displayId, tenantKey, `vault:${displayId}`, `guard:${displayId}`, `scan:${displayId}`, { source: 'erp_new_personal_signup' }]
    );
    const authorityAccount = result.rows[0] || (await findAuthorityByDisplayId(db, displayId));
    await recordAuthorityAction(db, { authorityAccount, actionType: 'personal_authority_created_for_erp', metadata: { tenantKey } });
    return { authorityAccount, authorityType: 'personal', approvedForImmediateLogin: true };
  }

  if (mode === 'new_business') {
    const displayId = createBusvDisplayId(process.env.BOOTSTRAP_BUSINESS_AUTHORITY_ID || process.env.AUTHORITY_BUSINESS_ID);
    const result = await db.query(
      `insert into authority_accounts (authority_type, display_id, legal_name, tenant_key, status, vault_root_id, guard_policy_id, scan_root_id, raw)
       values ('business',$1,$2,$3,'active',$4,$5,$6,$7)
       on conflict (display_id) do update set legal_name = excluded.legal_name, tenant_key = excluded.tenant_key, updated_at = now()
       returning *`,
      [displayId, businessName || legalName || displayId, tenantKey, `vault:${displayId}`, `guard:${displayId}`, `scan:${displayId}`, { source: 'erp_new_business_signup' }]
    );
    const authorityAccount = result.rows[0];
    await recordAuthorityAction(db, { authorityAccount, actionType: 'business_authority_created_for_erp', metadata: { tenantKey } });
    return { authorityAccount, authorityType: 'business', approvedForImmediateLogin: true };
  }

  const error = new Error('authority_start_mode must be existing, new_personal, or new_business.');
  error.statusCode = 400;
  throw error;
}

export async function createErpUserUnderAuthority(db, { authorityAccount, email, fullName, erpRole = 'employee', language = 'en', status = 'pending', authorityUserDisplayId = null, raw = {} }) {
  const roleClass = authorityAccount.authority_type === 'business'
    ? (ROLE_CLASS_BY_ERP_ROLE[erpRole] || ROLE_CLASS.USER)
    : ROLE_CLASS.USER;
  const authorityUser = await createOrResolveAuthorityUser(db, {
    authorityAccount,
    email,
    fullName,
    erpRole,
    roleClass,
    authorityUserDisplayId,
    raw
  });
  const result = await db.query(
    `insert into erp_users (email, full_name, role, role_class, language, status, must_change_password, raw, authority_account_id, authority_user_id, authority_display_id, authority_user_display_id)
     values ($1,$2,$3,$4,$5,$6,true,$7,$8,$9,$10,$11)
     on conflict (email) do update set
       full_name = excluded.full_name,
       role = excluded.role,
       role_class = excluded.role_class,
       authority_account_id = excluded.authority_account_id,
       authority_user_id = excluded.authority_user_id,
       authority_display_id = excluded.authority_display_id,
       authority_user_display_id = excluded.authority_user_display_id,
       updated_at = now()
     returning id, email, full_name, role, role_class, status, authority_display_id, authority_user_display_id`,
    [email, fullName, erpRole, authorityUser.role_class, language, status, raw, authorityAccount.id, authorityUser.id, authorityAccount.display_id, authorityUser.display_id]
  );
  return { erpUser: result.rows[0], authorityUser };
}
