import crypto from 'node:crypto';
import express from 'express';
import { Pool } from 'pg';

const DEFAULT_SCHEMA = process.env.DATABASE_SCHEMA || 'steelcraft_os_v1';
const SESSION_COOKIE = 'scb_os_session';
const STATE_COOKIE = 'scb_neroa_oauth_state';

const AUTH_REFS = Object.freeze({
  tenant: process.env.NEROA_AUTH_TENANT || 'tenant:steelcraft',
  app: process.env.NEROA_AUTH_APP || 'app:steelcraft',
  vaultNamespace: process.env.NEROA_AUTH_VAULT_NAMESPACE || 'steelcraft',
  clientSecretRef: process.env.NEROA_AUTH_CLIENT_SECRET_REF || 'vault-secret:steelcraft-microsoft-oauth-client-secret',
  tokenSecretRef: process.env.NEROA_AUTH_TOKEN_SECRET_REF || 'vault-secret:steelcraft-microsoft-oauth-tokens',
  database: process.env.NEROA_AUTH_DATABASE || 'database:steelcraft',
  policybound: process.env.NEROA_AUTH_POLICYBOUND || 'policybound:steelcraft-auth-runtime',
  guard: process.env.NEROA_AUTH_GUARD || 'guard:steelcraft-microsoft-oauth-issued',
  scan: process.env.NEROA_AUTH_SCAN || 'scan:steelcraft-microsoft-oauth-issued',
  liveUnlockRef: process.env.STEELCRAFT_LIVE_UNLOCK_REF || null
});

function getDatabaseConfig() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  return { connectionString: url.toString(), ssl: sslmode && sslmode !== 'disable' ? { rejectUnauthorized: false } : false };
}

const dbConfig = getDatabaseConfig();
const pool = dbConfig ? new Pool(dbConfig) : null;

function qident(value) {
  const text = String(value || DEFAULT_SCHEMA);
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) throw new Error('Invalid database schema name.');
  return '"' + text.replaceAll('"', '""') + '"';
}

function db() {
  if (!pool) {
    const error = new Error('DATABASE_URL is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return pool;
}

function baseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function appCallbackUrl(req) {
  return process.env.NEROA_AUTH_REDIRECT_URI || `${baseUrl(req)}/api/os/auth/neroa/callback`;
}

function cookieOptions(maxAgeMs) {
  return { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: maxAgeMs };
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function pkceChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function authSpineConfig(req) {
  const spineBaseUrl = process.env.NEROA_AUTH_SPINE_URL || process.env.NEROA_AUTH_URL || null;
  return {
    spineBaseUrl,
    authorizeUrl: process.env.NEROA_AUTH_AUTHORIZE_URL || (spineBaseUrl ? `${spineBaseUrl.replace(/\/+$/, '')}/oauth/authorize` : null),
    clientId: process.env.NEROA_AUTH_CLIENT_ID || 'steelcraft-microsoft-oauth-client',
    provider: process.env.NEROA_AUTH_PROVIDER || 'microsoft',
    redirectUri: appCallbackUrl(req),
    scope: process.env.NEROA_AUTH_SCOPE || 'openid profile email offline_access User.Read'
  };
}

async function ensureOsSchema(conn = db()) {
  const schema = qident(DEFAULT_SCHEMA);
  await conn.query(`create schema if not exists ${schema}`);
  await conn.query(`create table if not exists ${schema}.os_users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    full_name text,
    status text not null default 'active',
    default_role text not null default 'admin',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`);
  await conn.query(`create table if not exists ${schema}.os_auth_identities (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references ${schema}.os_users(id) on delete cascade,
    provider text not null,
    provider_subject text not null,
    provider_email text,
    created_at timestamptz not null default now(),
    unique(provider, provider_subject)
  )`);
  await conn.query(`create table if not exists ${schema}.os_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references ${schema}.os_users(id) on delete cascade,
    session_token_hash text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
  )`);
  await conn.query(`alter table ${schema}.os_sessions add column if not exists neroa_session_ref text`);
  await conn.query(`alter table ${schema}.os_sessions add column if not exists tenant_ref text default 'tenant:steelcraft'`);
  await conn.query(`alter table ${schema}.os_sessions add column if not exists app_ref text default 'app:steelcraft'`);
  await conn.query(`alter table ${schema}.os_sessions add column if not exists vault_token_ref text`);
  await conn.query(`alter table ${schema}.os_sessions add column if not exists guard_receipt_ref text`);
  await conn.query(`alter table ${schema}.os_sessions add column if not exists scan_receipt_ref text`);
  await conn.query(`create table if not exists ${schema}.os_oauth_runtime_requests (
    id uuid primary key default gen_random_uuid(),
    state_hash text not null unique,
    nonce_hash text not null,
    pkce_verifier_hash text not null,
    tenant_ref text not null,
    app_ref text not null,
    provider text not null,
    client_id text not null,
    redirect_uri text not null,
    vault_namespace text not null,
    policybound_ref text not null,
    guard_ref text not null,
    scan_ref text not null,
    consumed_at timestamptz,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
  )`);
  await conn.query(`create table if not exists ${schema}.os_projects (
    id uuid primary key default gen_random_uuid(),
    scb_job_number text unique,
    project_name text not null,
    customer_name text,
    stage text not null default 'lead',
    contract_value numeric(14,2) default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`);
  await conn.query(`create table if not exists ${schema}.os_audit_log (
    id bigserial primary key,
    actor_user_id uuid,
    action text not null,
    entity_type text,
    entity_id text,
    vault_id text default 'vault_steelcraft_001',
    receipt_ref text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`);
}

async function audit(action, metadata = {}, actorUserId = null) {
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  await db().query(
    `insert into ${schema}.os_audit_log (actor_user_id, action, entity_type, entity_id, vault_id, receipt_ref, metadata) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [actorUserId, action, metadata.entityType || 'auth', metadata.entityId || null, process.env.NEROA_CANONICAL_VAULT_ID || 'vault_steelcraft_001', metadata.receiptRef || 'guard_receipt_pending', JSON.stringify(metadata)]
  );
}

async function upsertNeroaUser({ subject, email, name }) {
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Neroa Auth Spine did not return a user email.');
  const userResult = await db().query(
    `insert into ${schema}.os_users (email, full_name, status, default_role) values ($1,$2,'active','admin') on conflict (email) do update set full_name = coalesce(excluded.full_name, ${schema}.os_users.full_name), updated_at = now() returning *`,
    [normalizedEmail, name || normalizedEmail.split('@')[0]]
  );
  const user = userResult.rows[0];
  await db().query(
    `insert into ${schema}.os_auth_identities (user_id, provider, provider_subject, provider_email) values ($1,$2,$3,$4) on conflict (provider, provider_subject) do update set user_id = excluded.user_id, provider_email = excluded.provider_email`,
    [user.id, 'neroa_auth_spine:microsoft', subject, normalizedEmail]
  );
  return user;
}

async function createTenantSession(userId, handoff) {
  await ensureOsSchema();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hash(token);
  const schema = qident(DEFAULT_SCHEMA);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db().query(
    `insert into ${schema}.os_sessions (user_id, session_token_hash, expires_at, neroa_session_ref, tenant_ref, app_ref, vault_token_ref, guard_receipt_ref, scan_receipt_ref) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [userId, tokenHash, expires, handoff.sessionRef, AUTH_REFS.tenant, AUTH_REFS.app, handoff.vaultTokenRef, handoff.guardReceiptRef, handoff.scanReceiptRef]
  );
  return { token, expires };
}

async function sessionUser(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  const result = await db().query(
    `select u.id, u.email, u.full_name, u.status, u.default_role, s.expires_at, s.neroa_session_ref, s.tenant_ref, s.app_ref from ${schema}.os_sessions s join ${schema}.os_users u on u.id = s.user_id where s.session_token_hash = $1 and s.expires_at > now() and u.status = 'active'`,
    [hash(token)]
  );
  return result.rows[0] || null;
}

async function saveRuntimeRequest(req, cfg, state, nonce, verifier) {
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  await db().query(
    `insert into ${schema}.os_oauth_runtime_requests (state_hash, nonce_hash, pkce_verifier_hash, tenant_ref, app_ref, provider, client_id, redirect_uri, vault_namespace, policybound_ref, guard_ref, scan_ref, expires_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now() + interval '10 minutes')`,
    [hash(state), hash(nonce), hash(verifier), AUTH_REFS.tenant, AUTH_REFS.app, cfg.provider, cfg.clientId, cfg.redirectUri, AUTH_REFS.vaultNamespace, AUTH_REFS.policybound, AUTH_REFS.guard, AUTH_REFS.scan]
  );
}

async function consumeRuntimeRequest(state, expected) {
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  const result = await db().query(
    `update ${schema}.os_oauth_runtime_requests set consumed_at = now() where state_hash = $1 and consumed_at is null and expires_at > now() and tenant_ref = $2 and app_ref = $3 and provider = $4 and client_id = $5 and redirect_uri = $6 returning *`,
    [hash(state), AUTH_REFS.tenant, AUTH_REFS.app, expected.provider, expected.clientId, expected.redirectUri]
  );
  return result.rows[0] || null;
}

function requireQuery(req, name) {
  const value = req.query?.[name];
  if (!value) {
    const error = new Error(`Missing required auth handoff field: ${name}`);
    error.statusCode = 400;
    throw error;
  }
  return String(value);
}

function registerSteelcraftOsAuthRoutes(app) {
  if (app.__steelcraftOsAuthRoutesRegistered) return;
  app.__steelcraftOsAuthRoutesRegistered = true;

  app.use((req, res, next) => {
    req.cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((item) => item.trim()).filter(Boolean).map((item) => {
      const index = item.indexOf('=');
      return index === -1 ? [item, ''] : [decodeURIComponent(item.slice(0, index)), decodeURIComponent(item.slice(index + 1))];
    }));
    next();
  });

  app.get('/api/os/status', async (req, res, next) => {
    try {
      await ensureOsSchema();
      const tables = await db().query(`select table_schema, table_name from information_schema.tables where table_schema = $1 order by table_name`, [DEFAULT_SCHEMA]);
      res.json({ ok: true, schema: DEFAULT_SCHEMA, databaseMode: process.env.STEELCRAFT_OS_DATABASE_MODE || 'schema_isolated', vaultId: process.env.NEROA_CANONICAL_VAULT_ID || null, tables: tables.rows });
    } catch (error) { next(error); }
  });

  app.get('/api/os/auth/config', (req, res) => {
    const cfg = authSpineConfig(req);
    res.json({
      ok: true,
      authority: 'neroa_auth_spine',
      primaryProvider: 'microsoft',
      microsoftConfigured: Boolean(cfg.authorizeUrl && cfg.clientId),
      redirectUri: cfg.redirectUri,
      schema: DEFAULT_SCHEMA,
      vaultId: process.env.NEROA_CANONICAL_VAULT_ID || null,
      refs: AUTH_REFS
    });
  });

  app.get('/api/os/auth/session', async (req, res, next) => {
    try { res.json({ ok: true, user: await sessionUser(req), vaultId: process.env.NEROA_CANONICAL_VAULT_ID || null, authority: 'neroa_auth_spine' }); } catch (error) { next(error); }
  });

  app.get('/api/os/auth/microsoft/start', async (req, res, next) => {
    try {
      const cfg = authSpineConfig(req);
      if (!cfg.authorizeUrl || !cfg.clientId) return res.status(501).json({ ok: false, error: 'Neroa Auth Spine is not configured. Set NEROA_AUTH_SPINE_URL and NEROA_AUTH_CLIENT_ID.' });
      if (process.env.STEELCRAFT_PRODUCTION_CUTOVER === 'true' && !AUTH_REFS.liveUnlockRef) return res.status(423).json({ ok: false, error: 'Production auth cutover requires STEELCRAFT_LIVE_UNLOCK_REF.' });
      const state = crypto.randomBytes(24).toString('base64url');
      const nonce = crypto.randomBytes(24).toString('base64url');
      const verifier = crypto.randomBytes(32).toString('base64url');
      await saveRuntimeRequest(req, cfg, state, nonce, verifier);
      res.cookie(STATE_COOKIE, state, cookieOptions(10 * 60 * 1000));
      const url = new URL(cfg.authorizeUrl);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', cfg.clientId);
      url.searchParams.set('redirect_uri', cfg.redirectUri);
      url.searchParams.set('scope', cfg.scope);
      url.searchParams.set('state', state);
      url.searchParams.set('nonce', nonce);
      url.searchParams.set('code_challenge', pkceChallenge(verifier));
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('tenant', AUTH_REFS.tenant);
      url.searchParams.set('app', AUTH_REFS.app);
      url.searchParams.set('provider', cfg.provider);
      url.searchParams.set('vault_namespace', AUTH_REFS.vaultNamespace);
      url.searchParams.set('vault_secret_client', AUTH_REFS.clientSecretRef);
      url.searchParams.set('vault_secret_tokens', AUTH_REFS.tokenSecretRef);
      url.searchParams.set('policybound', AUTH_REFS.policybound);
      url.searchParams.set('guard', AUTH_REFS.guard);
      url.searchParams.set('scan', AUTH_REFS.scan);
      await audit('neroa_auth_spine_oauth_started', { provider: cfg.provider, proofState: 'anchor_requested', refs: AUTH_REFS });
      res.redirect(url.toString());
    } catch (error) { next(error); }
  });

  app.get('/api/os/auth/neroa/callback', async (req, res, next) => {
    try {
      const cfg = authSpineConfig(req);
      const state = requireQuery(req, 'state');
      if (state !== req.cookies?.[STATE_COOKIE]) return res.redirect('/?auth=state_failed');
      const request = await consumeRuntimeRequest(state, cfg);
      if (!request) return res.redirect('/?auth=request_failed');
      if (requireQuery(req, 'tenant') !== AUTH_REFS.tenant) return res.redirect('/?auth=tenant_failed');
      if (requireQuery(req, 'app') !== AUTH_REFS.app) return res.redirect('/?auth=app_failed');
      if (requireQuery(req, 'provider') !== cfg.provider) return res.redirect('/?auth=provider_failed');
      const userRef = requireQuery(req, 'user_ref');
      const sessionRef = requireQuery(req, 'session_ref');
      const membershipRef = requireQuery(req, 'membership_ref');
      const vaultTokenRef = requireQuery(req, 'vault_token_ref');
      const guardReceiptRef = requireQuery(req, 'guard_receipt_ref');
      const scanReceiptRef = requireQuery(req, 'scan_receipt_ref');
      const email = String(req.query.email || '').trim().toLowerCase();
      const name = String(req.query.name || email || userRef);
      const user = await upsertNeroaUser({ subject: userRef, email, name });
      const session = await createTenantSession(user.id, { sessionRef, vaultTokenRef, guardReceiptRef, scanReceiptRef });
      await audit('neroa_tenant_session_issued', { provider: cfg.provider, userRef, sessionRef, membershipRef, vaultTokenRef, receiptRef: guardReceiptRef, refs: AUTH_REFS }, user.id);
      res.clearCookie(STATE_COOKIE, { path: '/' });
      res.cookie(SESSION_COOKIE, session.token, cookieOptions(1000 * 60 * 60 * 12));
      res.redirect('/');
    } catch (error) { next(error); }
  });

  app.post('/api/os/auth/logout', async (req, res, next) => {
    try {
      const token = req.cookies?.[SESSION_COOKIE];
      if (token) {
        await ensureOsSchema();
        const schema = qident(DEFAULT_SCHEMA);
        await db().query(`delete from ${schema}.os_sessions where session_token_hash = $1`, [hash(token)]);
      }
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  app.get('/api/os/projects', async (req, res, next) => {
    try {
      await ensureOsSchema();
      const schema = qident(DEFAULT_SCHEMA);
      const result = await db().query(`select * from ${schema}.os_projects order by updated_at desc limit 50`);
      res.json({ ok: true, projects: result.rows });
    } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftOsAuthAutoRegister) {
  express.application.listen = function patchedSteelcraftOsAuthListen(...args) {
    registerSteelcraftOsAuthRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__steelcraftOsAuthAutoRegister', { value: true });
}
