import express from 'express';
import { Pool } from 'pg';
import { ensureCrmCommunicationSchema, getCrmCommunicationReadiness } from './crmCommunicationSchema.js';

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  return url.toString();
}

const databaseUrl = getDatabaseUrl();
const crmPool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }) : null;

function requireCrmDatabase() {
  if (!crmPool) {
    const error = new Error('DATABASE_URL is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return crmPool;
}

function tenantKey(req) {
  return req.params.tenantKey || req.query.tenantKey || req.body?.tenantKey || req.body?.tenant_id || req.body?.tenantId || process.env.STEELCRAFT_TENANT_KEY || 'steelcraft';
}

function providerPlan() {
  return [
    { provider_key: 'neroa_mail', provider_label: 'Neroa Mail', channel: 'email', status: 'planned' },
    { provider_key: 'sendgrid', provider_label: 'SendGrid Email Pipe', channel: 'email', status: 'available_pipe' },
    { provider_key: 'twilio', provider_label: 'Twilio SMS / Voice Pipe', channel: 'sms', status: 'available_pipe' },
    { provider_key: 'twilio', provider_label: 'Twilio Voice Pipe', channel: 'voice', status: 'available_pipe' },
    { provider_key: 'telnyx', provider_label: 'Telnyx SMS / Voice Pipe', channel: 'sms', status: 'available_pipe' },
    { provider_key: 'bandwidth', provider_label: 'Bandwidth Carrier Pipe', channel: 'sms', status: 'future_pipe' },
    { provider_key: 'neroa_provider', provider_label: 'Neroa Communications API', channel: 'multi', status: 'level_2_foundation' }
  ];
}

async function seedProviders(db, tenantId) {
  for (const provider of providerPlan()) {
    await db.query(
      `insert into communication_providers (tenant_id, provider_key, provider_label, channel, status, config)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (tenant_id, provider_key, channel) do update set provider_label = excluded.provider_label, status = excluded.status, config = excluded.config, updated_at = now()`,
      [tenantId, provider.provider_key, provider.provider_label, provider.channel, provider.status, { seeded: true, layer: provider.provider_key === 'neroa_provider' ? 'level_2' : 'pipe' }]
    );
  }
}

async function getStatus(db, tenantId) {
  await ensureCrmCommunicationSchema(db);
  await seedProviders(db, tenantId);
  const counts = await db.query(`
    select
      (select count(*)::int from crm_companies where tenant_id = $1) as companies,
      (select count(*)::int from crm_people where tenant_id = $1) as people,
      (select count(*)::int from communication_threads where tenant_id = $1) as threads,
      (select count(*)::int from communication_messages where tenant_id = $1) as messages,
      (select count(*)::int from communication_jobs where tenant_id = $1) as jobs,
      (select count(*)::int from communication_providers where tenant_id = $1) as providers
  `, [tenantId]);
  const providers = await db.query('select id, provider_key, provider_label, channel, status, credentials_ref, config, updated_at from communication_providers where tenant_id = $1 order by provider_key, channel', [tenantId]);
  return { tenantId, readiness: getCrmCommunicationReadiness(), counts: counts.rows[0], providers: providers.rows };
}

function registerCrmCommunicationRoutes(app) {
  if (app.__neroaCrmCommunicationRoutesRegistered) return;
  app.__neroaCrmCommunicationRoutesRegistered = true;

  app.get('/api/crm/communications/status', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const status = await getStatus(db, tenantKey(req));
      res.json({ ok: true, ...status });
    } catch (error) { next(error); }
  });

  app.get('/api/profiles/:tenantKey/crm/communications/status', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const status = await getStatus(db, tenantKey(req));
      res.json({ ok: true, ...status });
    } catch (error) { next(error); }
  });

  app.get('/api/crm/communication-providers', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      await seedProviders(db, tenantId);
      const result = await db.query('select * from communication_providers where tenant_id = $1 order by provider_key, channel', [tenantId]);
      res.json({ ok: true, tenantId, providers: result.rows });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/communication-providers', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const providerKey = req.body?.providerKey || req.body?.provider_key || 'neroa_provider';
      const channel = req.body?.channel || 'multi';
      const label = req.body?.providerLabel || req.body?.provider_label || providerKey;
      const status = req.body?.status || 'draft';
      const result = await db.query(
        `insert into communication_providers (tenant_id, provider_key, provider_label, channel, status, credentials_ref, config)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (tenant_id, provider_key, channel) do update set provider_label = excluded.provider_label, status = excluded.status, credentials_ref = excluded.credentials_ref, config = excluded.config, updated_at = now()
         returning *`,
        [tenantId, providerKey, label, channel, status, req.body?.credentialsRef || req.body?.credentials_ref || null, req.body?.config || {}]
      );
      res.json({ ok: true, tenantId, provider: result.rows[0] });
    } catch (error) { next(error); }
  });

  app.get('/api/crm/communication-jobs', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const result = await db.query('select * from communication_jobs where tenant_id = $1 order by scheduled_at nulls last, created_at desc limit 100', [tenantId]);
      res.json({ ok: true, tenantId, jobs: result.rows });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/communication-jobs', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const result = await db.query(
        `insert into communication_jobs (tenant_id, company_id, person_id, thread_id, job_type, channel, provider_key, scheduled_at, status, approval_required, payload, scan_ref, vault_ref, guard_ref)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning *`,
        [
          tenantId,
          req.body?.companyId || req.body?.company_id || null,
          req.body?.personId || req.body?.person_id || null,
          req.body?.threadId || req.body?.thread_id || null,
          req.body?.jobType || req.body?.job_type || 'internal_task',
          req.body?.channel || 'task',
          req.body?.providerKey || req.body?.provider_key || 'neroa_provider',
          req.body?.scheduledAt || req.body?.scheduled_at || null,
          req.body?.status || 'draft',
          req.body?.approvalRequired ?? req.body?.approval_required ?? true,
          req.body?.payload || {},
          req.body?.scanRef || req.body?.scan_ref || null,
          req.body?.vaultRef || req.body?.vault_ref || null,
          req.body?.guardRef || req.body?.guard_ref || null
        ]
      );
      res.json({ ok: true, tenantId, job: result.rows[0] });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/inbound/email', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const subject = req.body?.subject || 'Inbound email';
      const fromEmail = req.body?.from || req.body?.fromEmail || req.body?.email || null;
      const thread = await db.query(
        `insert into communication_threads (tenant_id, room_context, subject, status, intent, priority, raw)
         values ($1,'contacts',$2,'open',$3,$4,$5)
         returning *`,
        [tenantId, subject, req.body?.intent || 'unclassified', req.body?.priority || 'normal', { source: 'crm_inbound_email', fromEmail }]
      );
      const message = await db.query(
        `insert into communication_messages (tenant_id, thread_id, direction, channel, provider_key, subject, body, delivery_status, intent, raw)
         values ($1,$2,'inbound','email',$3,$4,$5,'received',$6,$7)
         returning *`,
        [tenantId, thread.rows[0].id, req.body?.providerKey || req.body?.provider_key || 'neroa_mail', subject, req.body?.body || '', req.body?.intent || 'unclassified', req.body || {}]
      );
      res.json({ ok: true, tenantId, thread: thread.rows[0], message: message.rows[0] });
    } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__neroaCrmCommunicationAutoRegister) {
  express.application.listen = function patchedListen(...args) {
    registerCrmCommunicationRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__neroaCrmCommunicationAutoRegister', { value: true });
}
