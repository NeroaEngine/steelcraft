import crypto from 'node:crypto';
import express from 'express';
import { Pool } from 'pg';

const DEFAULT_SCHEMA = process.env.DATABASE_SCHEMA || 'steelcraft_os_v1';
const SESSION_COOKIE = 'scb_os_session';
const STATE_COOKIE = 'scb_ms_oauth_state';

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

function cookieOptions(maxAgeMs) {
  return { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: maxAgeMs };
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function decodeJwt(jwt) {
  const part = String(jwt || '').split('.')[1];
  if (!part) return {};
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

function microsoftConfig(req) {
  const tenant = process.env.MICROSOFT_TENANT_ID || process.env.AZURE_TENANT_ID || 'common';
  return {
    tenant,
    clientId: process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_CLIENT_ID || null,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET || null,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || process.env.AZURE_REDIRECT_URI || `${baseUrl(req)}/api/os/auth/microsoft/callback`,
    scopes: process.env.MICROSOFT_OAUTH_SCOPES || 'openid profile email offline_access User.Read'
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
  await db().query(`insert into ${schema}.os_audit_log (actor_user_id, action, entity_type, entity_id, vault_id, receipt_ref, metadata) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`, [actorUserId, action, metadata.entityType || 'auth', metadata.entityId || null, process.env.NEROA_CANONICAL_VAULT_ID || 'vault_steelcraft_001', metadata.receiptRef || 'guard_receipt_pending', JSON.stringify(metadata)]);
}

async function upsertOAuthUser({ provider, subject, email, name }) {
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('OAuth provider did not return an email.');
  const userResult = await db().query(`insert into ${schema}.os_users (email, full_name, status, default_role) values ($1,$2,'active','admin') on conflict (email) do update set full_name = coalesce(excluded.full_name, ${schema}.os_users.full_name), updated_at = now() returning *`, [normalizedEmail, name || normalizedEmail.split('@')[0]]);
  const user = userResult.rows[0];
  await db().query(`insert into ${schema}.os_auth_identities (user_id, provider, provider_subject, provider_email) values ($1,$2,$3,$4) on conflict (provider, provider_subject) do update set user_id = excluded.user_id, provider_email = excluded.provider_email`, [user.id, provider, subject, normalizedEmail]);
  return user;
}

async function createSession(userId) {
  await ensureOsSchema();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hash(token);
  const schema = qident(DEFAULT_SCHEMA);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db().query(`insert into ${schema}.os_sessions (user_id, session_token_hash, expires_at) values ($1,$2,$3)`, [userId, tokenHash, expires]);
  return { token, expires };
}

async function sessionUser(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  await ensureOsSchema();
  const schema = qident(DEFAULT_SCHEMA);
  const result = await db().query(`select u.id, u.email, u.full_name, u.status, u.default_role, s.expires_at from ${schema}.os_sessions s join ${schema}.os_users u on u.id = s.user_id where s.session_token_hash = $1 and s.expires_at > now() and u.status = 'active'`, [hash(token)]);
  return result.rows[0] || null;
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
    const cfg = microsoftConfig(req);
    res.json({ ok: true, primaryProvider: 'microsoft', microsoftConfigured: Boolean(cfg.clientId && cfg.clientSecret), redirectUri: cfg.redirectUri, schema: DEFAULT_SCHEMA, vaultId: process.env.NEROA_CANONICAL_VAULT_ID || null });
  });

  app.get('/api/os/auth/session', async (req, res, next) => {
    try { res.json({ ok: true, user: await sessionUser(req), vaultId: process.env.NEROA_CANONICAL_VAULT_ID || null }); } catch (error) { next(error); }
  });

  app.get('/api/os/auth/microsoft/start', async (req, res, next) => {
    try {
      const cfg = microsoftConfig(req);
      if (!cfg.clientId || !cfg.clientSecret) return res.status(501).json({ ok: false, error: 'Microsoft OAuth is not configured. Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_TENANT_ID.' });
      const state = crypto.randomBytes(24).toString('base64url');
      res.cookie(STATE_COOKIE, state, cookieOptions(10 * 60 * 1000));
      const url = new URL(`https://login.microsoftonline.com/${cfg.tenant}/oauth2/v2.0/authorize`);
      url.searchParams.set('client_id', cfg.clientId);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('redirect_uri', cfg.redirectUri);
      url.searchParams.set('response_mode', 'query');
      url.searchParams.set('scope', cfg.scopes);
      url.searchParams.set('state', state);
      await audit('microsoft_oauth_started', { provider: 'microsoft', proofState: 'anchor_requested' });
      res.redirect(url.toString());
    } catch (error) { next(error); }
  });

  app.get('/api/os/auth/microsoft/callback', async (req, res, next) => {
    try {
      const cfg = microsoftConfig(req);
      if (!req.query.code || req.query.state !== req.cookies?.[STATE_COOKIE]) return res.redirect('/?auth=state_failed');
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${cfg.tenant}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, code: String(req.query.code), redirect_uri: cfg.redirectUri, grant_type: 'authorization_code', scope: cfg.scopes }) });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenPayload.error_description || tokenPayload.error || 'Microsoft token exchange failed.');
      const claims = decodeJwt(tokenPayload.id_token);
      const subject = claims.oid || claims.sub;
      const email = claims.preferred_username || claims.email || claims.upn;
      const name = claims.name || email;
      const user = await upsertOAuthUser({ provider: 'microsoft', subject, email, name });
      const session = await createSession(user.id);
      await audit('microsoft_oauth_completed', { provider: 'microsoft', providerSubject: subject, email, proofState: 'anchor_requested' }, user.id);
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
