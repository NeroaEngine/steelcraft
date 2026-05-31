import express from 'express';
import multer from 'multer';
import { Pool } from 'pg';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEstimatingSchema } from './server/estimatingSchema.js';
import { ensureHrSchema } from './server/hrSchema.js';
import { ensureAccountingSchema } from './server/accountingSchema.js';
import { registerAccountingRoutes } from './server/accountingApi.js';
import { registerAccountingBankingDemoRoutes } from './server/accountingBankingDemoRoutes.js';
import { registerComptrollerProductionDemoRoutes } from './server/comptrollerProductionDemo.js';
import { registerNeroaConnectRoutes, ensureNeroaConnectSchema } from './server/neroaConnect.js';
import { authenticateUser, ensureAuthSchema, listAuthUsers, requestPasswordReset, resetPasswordWithToken, seedAuthUsers, updateUserLanguage } from './server/authSchema.js';
import { ensureQuoteWorkbookSchema, importQuoteWorkbook } from './server/quoteWorkbook.js';
import { ensureQuoteTemplateSchema, createTemplateFromWorkbook, listTemplates, getTemplate, updateTemplateVersion, upsertTemplateOverride } from './server/quoteTemplate.js';
import { mapMondayBoardsToSteelCraftWorkflow } from './server/steelcraftWorkflow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const port = process.env.PORT || 8080;
const mondayApiUrl = process.env.MONDAY_API_URL || 'https://api.monday.com/v2';
const steelcraftProfileKey = process.env.STEELCRAFT_TENANT_KEY || 'steelcraft';

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'dist'), {
  etag: false,
  lastModified: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  return url.toString();
}
const databaseUrl = getDatabaseUrl();
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }) : null;
function requireDatabase() {
  if (!pool) {
    const error = new Error('DATABASE_URL is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return pool;
}
function requireMondayToken() {
  if (!process.env.MONDAY_API_TOKEN) {
    const error = new Error('MONDAY_API_TOKEN is not configured for the Steel Craft tenant profile.');
    error.statusCode = 500;
    throw error;
  }
  return process.env.MONDAY_API_TOKEN;
}
function safeJson(value) { try { return value ? JSON.parse(value) : null; } catch { return null; } }
function tenantKey(req) { return req.params.tenantKey || req.query.tenantKey || steelcraftProfileKey; }
function requireSteelCraftProfile(key) {
  if (key !== steelcraftProfileKey) {
    const error = new Error('Monday.com migration is currently installed only on the Steel Craft customer profile. Add this tenant\'s Monday connection before syncing boards.');
    error.statusCode = 403;
    throw error;
  }
}

async function mondayQuery(query, variables = {}) {
  const token = requireMondayToken();
  const response = await fetch(mondayApiUrl, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const message = payload.errors?.map((item) => item.message).join('; ') || `Monday API returned ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status || 502;
    throw error;
  }
  return payload.data;
}

async function ensureProfileSchema(db) {
  await db.query(`
    create table if not exists tenant_profiles (
      tenant_key text primary key,
      display_name text not null,
      profile_type text not null default 'customer',
      industry_pack text,
      uiux_profile jsonb not null default '{}'::jsonb,
      import_profile jsonb not null default '{}'::jsonb,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    insert into tenant_profiles (tenant_key, display_name, profile_type, industry_pack, import_profile)
    values ($1, 'Steel Craft', 'customer', 'metal_buildings', '{"monday":true,"steelcraftWorkbook":true}'::jsonb)
    on conflict (tenant_key) do nothing;
  `, [steelcraftProfileKey]);
}

async function ensureTenantColumns(db) {
  await db.query(`
    alter table if exists monday_boards add column if not exists tenant_key text not null default 'steelcraft';
    alter table if exists monday_columns add column if not exists tenant_key text not null default 'steelcraft';
    alter table if exists monday_items add column if not exists tenant_key text not null default 'steelcraft';
    alter table if exists steelcraft_workflow_sources add column if not exists tenant_key text not null default 'steelcraft';
    alter table if exists quote_workbooks add column if not exists tenant_key text not null default 'steelcraft';
    alter table if exists quote_templates add column if not exists tenant_key text not null default 'steelcraft';
  `);
}

async function ensureSchema() {
  const db = requireDatabase();
  await db.query(`
    create table if not exists monday_boards (id text primary key, name text not null, workspace_name text, board_kind text, state text, raw jsonb not null, pulled_at timestamptz not null default now());
    create table if not exists monday_columns (id text not null, board_id text not null references monday_boards(id) on delete cascade, title text not null, type text, settings jsonb, raw jsonb not null, pulled_at timestamptz not null default now(), primary key (board_id, id));
    create table if not exists monday_items (id text primary key, board_id text not null references monday_boards(id) on delete cascade, name text not null, group_title text, raw jsonb not null, pulled_at timestamptz not null default now());
    create table if not exists steelcraft_workflow_sources (id bigserial primary key, source text not null default 'monday_api', source_board_id text, internal_name text not null, classification text, destination jsonb not null default '{}'::jsonb, field_map jsonb not null default '[]'::jsonb, workflow_map jsonb not null default '{}'::jsonb, verification_checklist jsonb not null default '[]'::jsonb, raw jsonb not null default '{}'::jsonb, pulled_at timestamptz not null default now(), unique (source, source_board_id));
    create table if not exists companies (id bigserial primary key, source text default 'manual', source_id text, name text not null, company_type text, email text, phone text, raw jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (source, source_id));
    create table if not exists projects (id bigserial primary key, source text default 'manual', source_id text, name text not null, status text, company_id bigint references companies(id), raw jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (source, source_id));
    create table if not exists portal_activity_logs (id bigserial primary key, actor text, action text not null, entity_type text, entity_id text, metadata jsonb, created_at timestamptz not null default now());
  `);
  await ensureProfileSchema(db);
  await ensureAuthSchema(db); await seedAuthUsers(db); await ensureEstimatingSchema(db); await ensureQuoteWorkbookSchema(db); await ensureQuoteTemplateSchema(db); await ensureTenantColumns(db); await ensureAccountingSchema(db); await ensureHrSchema(db); await ensureNeroaConnectSchema(db);
}

async function pullMondayBoards() {
  return mondayQuery(`query SteelCraftBoards { boards(limit: 100) { id name board_kind state workspace { id name } columns { id title type settings_str } } }`);
}
async function syncMondayBoards(profileKey = steelcraftProfileKey) {
  requireSteelCraftProfile(profileKey);
  await ensureSchema();
  const data = await pullMondayBoards();
  for (const board of data.boards) {
    await pool.query(
      `insert into monday_boards (tenant_key, id, name, workspace_name, board_kind, state, raw, pulled_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       on conflict (id) do update set tenant_key = excluded.tenant_key, name = excluded.name, workspace_name = excluded.workspace_name, board_kind = excluded.board_kind, state = excluded.state, raw = excluded.raw, pulled_at = now()`,
      [profileKey, board.id, board.name, board.workspace?.name || null, board.board_kind, board.state, board]
    );
    for (const column of board.columns || []) {
      await pool.query(
        `insert into monday_columns (tenant_key, id, board_id, title, type, settings, raw, pulled_at)
         values ($1, $2, $3, $4, $5, $6, $7, now())
         on conflict (board_id, id) do update set tenant_key = excluded.tenant_key, title = excluded.title, type = excluded.type, settings = excluded.settings, raw = excluded.raw, pulled_at = now()`,
        [profileKey, column.id, board.id, column.title, column.type, safeJson(column.settings_str), column]
      );
    }
  }
  await pool.query(`insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1, $2, $3, $4)`, ['system', 'monday_boards_synced', 'monday', { tenantKey: profileKey, board_count: data.boards.length }]);
  return data.boards;
}
async function auditSteelCraftWorkflow({ save = false, profileKey = steelcraftProfileKey } = {}) {
  requireSteelCraftProfile(profileKey);
  await ensureSchema();
  const data = await pullMondayBoards();
  const mapped = mapMondayBoardsToSteelCraftWorkflow(data.boards);
  if (save) {
    for (const flow of mapped.workflows) {
      await pool.query(
        `insert into steelcraft_workflow_sources (tenant_key, source, source_board_id, internal_name, classification, destination, field_map, workflow_map, verification_checklist, raw, pulled_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
         on conflict (source, source_board_id) do update set tenant_key = excluded.tenant_key, internal_name = excluded.internal_name, classification = excluded.classification, destination = excluded.destination, field_map = excluded.field_map, workflow_map = excluded.workflow_map, verification_checklist = excluded.verification_checklist, raw = excluded.raw, pulled_at = now()`,
        [profileKey, 'monday_api', flow.sourceBoardId, flow.internalName, flow.classification, flow.destination, flow.fieldMap, flow.workflow, flow.verificationChecklist, flow]
      );
    }
    await pool.query(`insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`, ['system', 'steelcraft_workflow_audit_saved', 'workflow_source', { tenantKey: profileKey, mappedWorkflowCount: mapped.mappedWorkflowCount }]);
  }
  return { ...mapped, tenantKey: profileKey };
}

async function importProfileWorkbook(req, res, next) {
  try {
    await ensureSchema();
    const profileKey = tenantKey(req);
    const db = requireDatabase();
    const result = await importQuoteWorkbook(db, req.file, req.body.actor || 'estimating');
    if (result.workbook?.id) await db.query('update quote_workbooks set tenant_key = $1, updated_at = now() where id = $2', [profileKey, result.workbook.id]);
    res.json({ ok: true, tenantKey: profileKey, ...result });
  } catch (error) { next(error); }
}

app.get('/api/build', (req, res) => { res.json({ ok: true, commit: 'tenant-profile-import-scope', accountingHardLock: true, neroaConnect: true, comptrollerProductionDemo: true }); });
app.get('/api/health', async (req, res) => { const checks = { app: 'ok', database: 'not_configured', monday: process.env.MONDAY_API_TOKEN ? 'steelcraft_configured' : 'not_configured', spaces: process.env.DO_SPACES_BUCKET ? 'configured' : 'not_configured', auth: 'not_checked', neroaConnect: 'not_checked' }; try { if (pool) { await pool.query('select 1 as ok'); checks.database = 'connected'; checks.auth = 'database_backed'; checks.neroaConnect = 'schema_ready'; } } catch (error) { checks.database = `error: ${error.message}`; checks.auth = 'error'; checks.neroaConnect = 'error'; } res.json({ ok: checks.database === 'connected', checks, steelcraftProfileKey }); });
app.post('/api/setup/schema', async (req, res, next) => { try { await ensureSchema(); await pool.query(`insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1, $2, $3, $4)`, ['system', 'schema_initialized', 'database', { tenantProfiles: true, estimating: true, quoteWorkbooks: true, quoteTemplates: true, accounting: true, hr: true, auth: true, steelcraftWorkflow: true, neroaConnect: true }]); res.json({ ok: true, message: 'ERP schema initialized with tenant profiles. Steel Craft Monday and workbook imports are scoped to the Steel Craft profile.' }); } catch (error) { next(error); } });

app.post('/api/auth/login', async (req, res, next) => { try { await ensureSchema(); const user = await authenticateUser(requireDatabase(), req.body?.email, req.body?.password); if (!user) return res.status(401).json({ ok: false, error: 'Invalid email or password.' }); res.json({ ok: true, user }); } catch (error) { next(error); } });
app.post('/api/auth/forgot-password', async (req, res, next) => { try { await ensureSchema(); const result = await requestPasswordReset(requireDatabase(), req.body?.email, req.ip); if (result.sent) await pool.query(`insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`, ['system', 'password_reset_requested', 'erp_user', { email: req.body?.email, emailProvider: 'neroa_mail_pending' }]); res.json({ ok: true, message: 'If that email exists, a password reset link has been prepared. Email delivery will run through Neroa Mail when that service is connected.' }); } catch (error) { next(error); } });
app.post('/api/auth/reset-password', async (req, res, next) => { try { await ensureSchema(); const user = await resetPasswordWithToken(requireDatabase(), req.body?.token, req.body?.password); if (!user) return res.status(400).json({ ok: false, error: 'Reset link is invalid, expired, or password is too short.' }); await pool.query(`insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata) values ($1,$2,$3,$4,$5)`, [user.email, 'password_reset_completed', 'erp_user', String(user.id), { email: user.email }]); res.json({ ok: true, user }); } catch (error) { next(error); } });
app.get('/api/auth/users', async (req, res, next) => { try { await ensureSchema(); const users = await listAuthUsers(requireDatabase()); res.json({ ok: true, users }); } catch (error) { next(error); } });
app.patch('/api/auth/users/:id/language', async (req, res, next) => { try { await ensureSchema(); const user = await updateUserLanguage(requireDatabase(), req.params.id, req.body?.language || 'en'); if (!user) return res.status(404).json({ ok: false, error: 'User not found.' }); res.json({ ok: true, user }); } catch (error) { next(error); } });

app.get('/api/profiles', async (req, res, next) => { try { await ensureSchema(); const profiles = await requireDatabase().query('select * from tenant_profiles order by lower(display_name)'); res.json({ ok: true, profiles: profiles.rows }); } catch (error) { next(error); } });
app.post('/api/profiles', async (req, res, next) => { try { await ensureSchema(); const key = req.body.tenantKey || req.body.tenant_key; const name = req.body.displayName || req.body.display_name || key; if (!key) return res.status(400).json({ ok: false, error: 'tenantKey is required.' }); const result = await requireDatabase().query(`insert into tenant_profiles (tenant_key, display_name, industry_pack, uiux_profile, import_profile) values ($1,$2,$3,$4,$5) on conflict (tenant_key) do update set display_name = excluded.display_name, industry_pack = excluded.industry_pack, uiux_profile = excluded.uiux_profile, import_profile = excluded.import_profile, updated_at = now() returning *`, [key, name, req.body.industryPack || null, req.body.uiuxProfile || {}, req.body.importProfile || {}]); res.json({ ok: true, profile: result.rows[0] }); } catch (error) { next(error); } });

app.get('/api/estimating/schema/status', async (req, res, next) => { try { await ensureSchema(); const tables = await requireDatabase().query(`select table_name from information_schema.tables where table_schema = 'public' and (table_name in ('tenant_profiles', 'estimates', 'estimate_cost_lines', 'estimate_deposit_schedule', 'quotation_versions', 'quotation_lines', 'project_checklist_items', 'invoices', 'invoice_lines', 'schedule_of_values', 'change_orders', 'quote_workbooks', 'quote_workbook_sheets', 'quote_templates', 'quote_template_versions', 'quote_template_overrides', 'steelcraft_workflow_sources', 'erp_users', 'erp_password_reset_tokens', 'connect_threads', 'connect_messages', 'connect_route_packets', 'connect_action_packets') or table_name like 'accounting_%') order by table_name`); res.json({ ok: true, tables: tables.rows.map((row) => row.table_name) }); } catch (error) { next(error); } });
app.post('/api/estimating/quote-workbooks', upload.single('workbook'), importProfileWorkbook);
app.post('/api/profiles/:tenantKey/estimating/quote-workbooks', upload.single('workbook'), importProfileWorkbook);
app.get('/api/estimating/quote-workbooks', async (req, res, next) => { try { await ensureSchema(); const profileKey = tenantKey(req); const workbooks = await requireDatabase().query(`select qw.id, qw.tenant_key, qw.original_filename, qw.file_size, qw.sheet_count, qw.detected_total, qw.status, qw.estimate_id, qw.created_at, e.project_name, qv.id as quotation_id, qv.total as quote_total from quote_workbooks qw left join estimates e on e.id = qw.estimate_id left join quotation_versions qv on qv.estimate_id = e.id where qw.tenant_key = $1 order by qw.created_at desc limit 20`, [profileKey]); res.json({ ok: true, tenantKey: profileKey, workbooks: workbooks.rows }); } catch (error) { next(error); } });
app.get('/api/profiles/:tenantKey/estimating/quote-workbooks', async (req, res, next) => { req.query.tenantKey = req.params.tenantKey; return app._router.handle(req, res, next); });
app.get('/api/estimating/quote-workbooks/:id', async (req, res, next) => { try { await ensureSchema(); const db = requireDatabase(); const profileKey = tenantKey(req); const workbook = await db.query(`select * from quote_workbooks where id = $1 and tenant_key = $2`, [req.params.id, profileKey]); if (!workbook.rows[0]) return res.status(404).json({ ok: false, error: 'Quote workbook not found for this tenant profile.' }); const sheets = await db.query(`select sheet_name, row_count, column_count, detected_numbers, preview_rows from quote_workbook_sheets where workbook_id = $1 order by id`, [req.params.id]); const fields = await db.query(`select * from quote_workbook_metadata_fields where workbook_id = $1 order by id`, [req.params.id]); const ranges = await db.query(`select * from quote_workbook_metadata_ranges where workbook_id = $1 order by id`, [req.params.id]); const formulas = await db.query(`select * from quote_workbook_formulas where workbook_id = $1 order by sheet_name, cell_address`, [req.params.id]); const automations = await db.query(`select * from quote_workbook_automations where workbook_id = $1 order by id`, [req.params.id]); res.json({ ok: true, tenantKey: profileKey, workbook: workbook.rows[0], sheets: sheets.rows, fields: fields.rows, ranges: ranges.rows, formulas: formulas.rows, automations: automations.rows }); } catch (error) { next(error); } });
app.post('/api/estimating/quote-workbooks/:id/create-template', async (req, res, next) => { try { await ensureSchema(); const db = requireDatabase(); const profileKey = tenantKey(req); const workbook = await db.query('select id from quote_workbooks where id = $1 and tenant_key = $2', [req.params.id, profileKey]); if (!workbook.rows[0]) return res.status(404).json({ ok: false, error: 'Quote workbook not found for this tenant profile.' }); const template = await createTemplateFromWorkbook(db, req.params.id, req.body.actor || 'estimating'); if (template.template?.id) await db.query('update quote_templates set tenant_key = $1, updated_at = now() where id = $2', [profileKey, template.template.id]); res.json({ ok: true, tenantKey: profileKey, ...template }); } catch (error) { next(error); } });
app.get('/api/estimating/quote-templates', async (req, res, next) => { try { await ensureSchema(); const profileKey = tenantKey(req); const templates = await listTemplates(requireDatabase()); res.json({ ok: true, tenantKey: profileKey, templates: templates.filter((item) => (item.tenant_key || steelcraftProfileKey) === profileKey) }); } catch (error) { next(error); } });
app.get('/api/estimating/quote-templates/:id', async (req, res, next) => { try { await ensureSchema(); const template = await getTemplate(requireDatabase(), req.params.id); if (!template) return res.status(404).json({ ok: false, error: 'Quote template not found.' }); res.json({ ok: true, ...template }); } catch (error) { next(error); } });
app.patch('/api/estimating/quote-template-versions/:id', async (req, res, next) => { try { await ensureSchema(); const version = await updateTemplateVersion(requireDatabase(), req.params.id, req.body, req.body.actor || 'estimating'); res.json({ ok: true, version }); } catch (error) { next(error); } });
app.put('/api/estimating/quote-template-versions/:id/overrides', async (req, res, next) => { try { await ensureSchema(); const override = await upsertTemplateOverride(requireDatabase(), req.params.id, req.body, req.body.actor || 'estimating'); res.json({ ok: true, override }); } catch (error) { next(error); } });

registerAccountingRoutes(app, requireDatabase, ensureSchema);
registerAccountingBankingDemoRoutes(app, requireDatabase, ensureSchema);
registerComptrollerProductionDemoRoutes(app);
registerNeroaConnectRoutes(app, requireDatabase, ensureSchema);

app.get('/api/hr/schema/status', async (req, res, next) => { try { await ensureSchema(); const tables = await requireDatabase().query(`select table_name from information_schema.tables where table_schema = 'public' and table_name in ('employees', 'pto_policies', 'pto_balances', 'pto_requests', 'company_holidays', 'handbook_documents', 'handbook_acknowledgements', 'onboarding_checklists', 'onboarding_tasks', 'training_courses', 'training_lessons', 'employee_training_assignments') order by table_name`); res.json({ ok: true, tables: tables.rows.map((row) => row.table_name) }); } catch (error) { next(error); } });
app.get('/api/monday/boards', async (req, res, next) => { try { const profileKey = tenantKey(req); requireSteelCraftProfile(profileKey); const data = await pullMondayBoards(); res.json({ ok: true, tenantKey: profileKey, boards: data.boards }); } catch (error) { next(error); } });
app.get('/api/profiles/:tenantKey/monday/boards', async (req, res, next) => { try { const profileKey = tenantKey(req); requireSteelCraftProfile(profileKey); const data = await pullMondayBoards(); res.json({ ok: true, tenantKey: profileKey, boards: data.boards }); } catch (error) { next(error); } });
app.post('/api/monday/sync-boards', async (req, res, next) => { try { const profileKey = tenantKey(req); const boards = await syncMondayBoards(profileKey); res.json({ ok: true, tenantKey: profileKey, syncedBoards: boards.length }); } catch (error) { next(error); } });
app.post('/api/profiles/:tenantKey/monday/sync-boards', async (req, res, next) => { try { const profileKey = tenantKey(req); const boards = await syncMondayBoards(profileKey); res.json({ ok: true, tenantKey: profileKey, syncedBoards: boards.length }); } catch (error) { next(error); } });
app.get('/api/monday/migration/start', async (req, res, next) => { try { const profileKey = tenantKey(req); const boards = await syncMondayBoards(profileKey); res.json({ ok: true, tenantKey: profileKey, message: 'Steel Craft Monday source board and column structure synced only into the Steel Craft tenant profile.', syncedBoards: boards.length, next: 'Review /api/steelcraft/workflow/audit?save=true.' }); } catch (error) { next(error); } });
app.get('/api/monday/migration/summary', async (req, res, next) => { try { await ensureSchema(); const profileKey = tenantKey(req); const boards = await pool.query(`select b.id, b.name, b.workspace_name, b.board_kind, b.state, b.pulled_at, count(c.id)::int as column_count from monday_boards b left join monday_columns c on c.board_id = b.id and c.tenant_key = b.tenant_key where b.tenant_key = $1 group by b.id order by lower(b.name)`, [profileKey]); res.json({ ok: true, tenantKey: profileKey, boards: boards.rows }); } catch (error) { next(error); } });
app.get('/api/steelcraft/workflow/audit', async (req, res, next) => { try { const mapped = await auditSteelCraftWorkflow({ save: req.query.save === 'true', profileKey: tenantKey(req) }); res.json(mapped); } catch (error) { next(error); } });
app.get('/api/steelcraft/workflow/sources', async (req, res, next) => { try { await ensureSchema(); const profileKey = tenantKey(req); const result = await requireDatabase().query(`select id, tenant_key, source, source_board_id, internal_name, classification, destination, workflow_map, verification_checklist, pulled_at from steelcraft_workflow_sources where tenant_key = $1 order by internal_name`, [profileKey]); res.json({ ok: true, tenantKey: profileKey, sources: result.rows }); } catch (error) { next(error); } });
app.get('/api/spaces/status', async (req, res, next) => { try { if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !process.env.DO_SPACES_ENDPOINT) return res.json({ ok: false, configured: false }); const client = new S3Client({ endpoint: process.env.DO_SPACES_ENDPOINT, region: process.env.DO_SPACES_REGION || 'us-east-1', credentials: { accessKeyId: process.env.DO_SPACES_KEY, secretAccessKey: process.env.DO_SPACES_SECRET } }); await client.send(new ListBucketsCommand({})); res.json({ ok: true, configured: true, bucket: process.env.DO_SPACES_BUCKET || null }); } catch (error) { next(error); } });

app.use((req, res, next) => { if (req.path.startsWith('/api/')) return next(); res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.sendFile(path.join(__dirname, 'dist', 'index.html')); });
app.use((error, req, res, next) => { const status = error.statusCode || 500; res.status(status).json({ ok: false, error: error.message }); });
app.listen(port, () => { console.log(`Steel Craft portal server listening on ${port}`); });
