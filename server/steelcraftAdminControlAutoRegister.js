import express from 'express';
import { Pool } from 'pg';
import { ensureAuthSchema, listAuthUsers } from './authSchema.js';

const ROLES = new Set(['developer', 'admin', 'accounting', 'employee', 'vendor', 'customer']);
const STATUSES = new Set(['active', 'disabled', 'pending']);
const ROLE_CLASS = { developer: '10', admin: '11', accounting: '12', employee: '13', vendor: '14', customer: '15' };

function getDatabaseConfig() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  return { connectionString: url.toString(), ssl: sslmode && sslmode !== 'disable' ? { rejectUnauthorized: false } : false };
}

const dbConfig = getDatabaseConfig();
const pool = dbConfig ? new Pool(dbConfig) : null;
function requireDatabase() { if (!pool) { const error = new Error('DATABASE_URL is not configured.'); error.statusCode = 500; throw error; } return pool; }
function cleanText(value) { const text = String(value == null ? '' : value).trim(); return text || null; }
function normalizeRole(value) { const role = String(value || 'employee').trim().toLowerCase(); return ROLES.has(role) ? role : 'employee'; }
function normalizeStatus(value) { const status = String(value || 'active').trim().toLowerCase(); return STATUSES.has(status) ? status : 'active'; }
function publicUser(row) { return { id: row.id, email: row.email, full_name: row.full_name, name: row.full_name, role: row.role, role_class: row.role_class, language: row.language, status: row.status, last_login_at: row.last_login_at, created_at: row.created_at, updated_at: row.updated_at }; }

async function listUsers(db) {
  await ensureAuthSchema(db);
  const users = await listAuthUsers(db);
  return users.map(publicUser);
}

async function upsertUser(db, payload = {}) {
  await ensureAuthSchema(db);
  const email = cleanText(payload.email || payload.userEmail || payload.user_email);
  if (!email || !email.includes('@')) { const error = new Error('A valid user email is required.'); error.statusCode = 400; throw error; }
  const fullName = cleanText(payload.fullName || payload.full_name || payload.name) || email.split('@')[0];
  const role = normalizeRole(payload.role);
  const status = normalizeStatus(payload.status);
  const language = cleanText(payload.language) || 'en';
  const result = await db.query(
    `insert into erp_users (email, full_name, role, role_class, language, status, raw)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb)
     on conflict (email) do update set full_name = excluded.full_name, role = excluded.role, role_class = excluded.role_class, language = excluded.language, status = excluded.status, raw = coalesce(erp_users.raw, '{}'::jsonb) || excluded.raw, updated_at = now()
     returning *`,
    [email, fullName, role, ROLE_CLASS[role] || null, language, status, { source: 'steelcraft_admin_control_center', portalAccess: payload.portalAccess || null }]
  );
  await db.query(`insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata) values ($1,'admin_user_upserted','erp_user',$2,$3::jsonb)`, [payload.actor || 'admin_control_center', String(result.rows[0].id), { email, role, status }]).catch(() => null);
  return publicUser(result.rows[0]);
}

async function setUserStatus(db, id, status) {
  await ensureAuthSchema(db);
  const result = await db.query(`update erp_users set status = $1, updated_at = now() where id = $2 returning *`, [normalizeStatus(status), id]);
  if (!result.rows[0]) { const error = new Error('User not found.'); error.statusCode = 404; throw error; }
  return publicUser(result.rows[0]);
}

function registerSteelcraftAdminControlRoutes(app) {
  if (app.__steelcraftAdminControlRoutesRegistered) return;
  app.__steelcraftAdminControlRoutesRegistered = true;

  app.get('/api/steelcraft/admin/users', async (req, res, next) => {
    try { res.json({ ok: true, users: await listUsers(requireDatabase()) }); } catch (error) { next(error); }
  });

  app.post('/api/steelcraft/admin/users', express.json({ limit: '2mb' }), async (req, res, next) => {
    try { const db = requireDatabase(); const user = await upsertUser(db, req.body || {}); res.json({ ok: true, user, users: await listUsers(db) }); } catch (error) { next(error); }
  });

  app.patch('/api/steelcraft/admin/users/:id/status', express.json({ limit: '1mb' }), async (req, res, next) => {
    try { const db = requireDatabase(); const user = await setUserStatus(db, req.params.id, req.body?.status); res.json({ ok: true, user, users: await listUsers(db) }); } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftAdminControlAutoRegister) {
  express.application.listen = function patchedSteelcraftAdminControlListen(...args) { registerSteelcraftAdminControlRoutes(this); return originalListen.apply(this, args); };
  Object.defineProperty(express.application, '__steelcraftAdminControlAutoRegister', { value: true });
}
