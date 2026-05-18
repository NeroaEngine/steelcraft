const DEFAULT_TENANT = 'steelcraft-demo';

function normalizeText(value) {
  return String(value || '').trim();
}

function inferIntent(message = '', context = {}) {
  const text = message.toLowerCase();
  if (/setup|onboard|customer list|vendor list|quickbooks|bank|tax|fixed cost/.test(text)) return 'setup_assistant';
  if (/approve|approval|proof|photo|art|mockup|screen print|proofing/.test(text)) return 'approval_flow';
  if (/invoice|payment|past due|collection|bill|comptroller|cash|ledger/.test(text)) return 'comptroller_accounting';
  if (/video|meeting|call|screen share|recording/.test(text)) return 'video_support';
  if (/support|bug|error|help|training|sop/.test(text)) return 'help_support';
  if (context?.currentRoom) return 'room_context_help';
  return 'general_help';
}

function routeDecision(intent, message = '') {
  const batchIntent = ['message_summary', 'bulk_classification', 'sop_generation', 'record_enrichment'];
  const highRisk = ['approval_flow', 'comptroller_accounting'];
  const customerWaiting = !batchIntent.includes(intent);
  return {
    intent,
    surface: 'neroa_connect',
    module: intent === 'setup_assistant' ? 'neroa_erp.setup' : intent === 'comptroller_accounting' ? 'neroa_erp.comptroller' : 'neroa_connect.help',
    model_route: {
      default_model: 'Neroa Mini',
      escalation_model: highRisk.includes(intent) ? 'Neroa 5.4' : 'Neroa 5.4 if uncertain',
      live_or_batch: customerWaiting ? 'live' : 'batch',
      batch_eligible: !customerWaiting,
      risk_level: highRisk.includes(intent) ? 'high' : intent === 'setup_assistant' ? 'medium' : 'low',
      customer_waiting: customerWaiting,
      proof_required: highRisk.includes(intent) || intent === 'setup_assistant',
      review_required: highRisk.includes(intent),
      estimated_credit_class: message.length > 1200 ? 'medium' : 'low'
    },
    policy_gate: highRisk.includes(intent) ? 'owner_or_admin_approval_required_before_action' : 'standard_role_check',
    proof_hook: highRisk.includes(intent) || intent === 'setup_assistant' ? 'connect_action_packet_proof_ready' : 'connect_message_audit_only'
  };
}

function assistantReply(intent) {
  if (intent === 'setup_assistant') return 'I can help set this up. Upload or connect the customer list, vendor list, bank feed, QuickBooks if used, tax location, fixed costs, daily report time, and approval recipients. I will route each setup step through Neroa Policy and Proof when needed.';
  if (intent === 'approval_flow') return 'I can route this as an approval thread. I will attach it to the correct job, proof, invoice, photo approval, or Comptroller packet and keep it proof-ready before any action is posted.';
  if (intent === 'comptroller_accounting') return 'I can open the Comptroller lane, explain what was matched, show the ledger account, flag exceptions, and wait for owner approval before posting.';
  if (intent === 'video_support') return 'I can prepare a Neroa Video support path. For now I will create the Connect thread and route the next step to video support when that lane is wired.';
  if (intent === 'help_support') return 'I can help from SOPs, ERP context, or support routing. If this needs a human, I will turn it into a Neroa Messaging thread or support item.';
  return 'Hi, I am Neroa. I can help with setup, accounting, customer messages, vendor messages, approvals, SOPs, support, or routing this to the right ERP record.';
}

export async function ensureNeroaConnectSchema(db) {
  await db.query(`
    create table if not exists connect_threads (
      id bigserial primary key,
      tenant_id text not null default 'default',
      thread_type text not null default 'help',
      title text not null,
      status text not null default 'open',
      created_by text,
      context jsonb not null default '{}'::jsonb,
      route_state jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists connect_messages (
      id bigserial primary key,
      thread_id bigint not null references connect_threads(id) on delete cascade,
      tenant_id text not null default 'default',
      sender_type text not null,
      sender_id text,
      body text not null,
      message_kind text not null default 'message',
      route_decision jsonb not null default '{}'::jsonb,
      proof_state jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists connect_thread_links (
      id bigserial primary key,
      thread_id bigint not null references connect_threads(id) on delete cascade,
      tenant_id text not null default 'default',
      entity_type text not null,
      entity_id text,
      link_role text not null default 'context',
      created_at timestamptz not null default now()
    );

    create table if not exists connect_route_packets (
      id bigserial primary key,
      thread_id bigint references connect_threads(id) on delete set null,
      message_id bigint references connect_messages(id) on delete set null,
      tenant_id text not null default 'default',
      intent text not null,
      module text not null,
      route_decision jsonb not null,
      status text not null default 'ready',
      created_at timestamptz not null default now()
    );

    create table if not exists connect_action_packets (
      id bigserial primary key,
      route_packet_id bigint references connect_route_packets(id) on delete set null,
      tenant_id text not null default 'default',
      action_type text not null,
      target_module text not null,
      risk_level text not null default 'low',
      proof_required boolean not null default false,
      review_required boolean not null default false,
      status text not null default 'draft',
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);
}

export async function createConnectMessage(db, payload = {}) {
  await ensureNeroaConnectSchema(db);
  const tenantId = payload.tenantId || payload.tenant_id || DEFAULT_TENANT;
  const body = normalizeText(payload.message || payload.body);
  if (!body) {
    const error = new Error('Message is required.');
    error.statusCode = 400;
    throw error;
  }
  const context = payload.context || {};
  const intent = inferIntent(body, context);
  const route = routeDecision(intent, body);
  const threadType = payload.threadType || intent;
  let thread = null;
  if (payload.threadId) {
    const existing = await db.query(`select * from connect_threads where id = $1`, [payload.threadId]);
    thread = existing.rows[0] || null;
  }
  if (!thread) {
    const title = payload.title || (intent === 'setup_assistant' ? 'Neroa Setup Assistant' : intent === 'comptroller_accounting' ? 'Neroa Comptroller' : 'Neroa Help');
    const result = await db.query(
      `insert into connect_threads (tenant_id, thread_type, title, created_by, context, route_state)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [tenantId, threadType, title, payload.actor || payload.userId || 'user', context, route]
    );
    thread = result.rows[0];
  }

  const userMessage = await db.query(
    `insert into connect_messages (thread_id, tenant_id, sender_type, sender_id, body, message_kind, route_decision, proof_state)
     values ($1,$2,'user',$3,$4,'message',$5,$6) returning *`,
    [thread.id, tenantId, payload.actor || payload.userId || 'user', body, route, { proof_required: route.model_route.proof_required, status: 'captured' }]
  );

  if (context.entityType || context.linked_entity_type) {
    await db.query(
      `insert into connect_thread_links (thread_id, tenant_id, entity_type, entity_id, link_role)
       values ($1,$2,$3,$4,$5)`,
      [thread.id, tenantId, context.entityType || context.linked_entity_type, context.entityId || context.linked_entity_id || null, context.linkRole || 'context']
    );
  }

  const routePacket = await db.query(
    `insert into connect_route_packets (thread_id, message_id, tenant_id, intent, module, route_decision, status)
     values ($1,$2,$3,$4,$5,$6,'ready') returning *`,
    [thread.id, userMessage.rows[0].id, tenantId, route.intent, route.module, route]
  );

  const actionPacket = await db.query(
    `insert into connect_action_packets (route_packet_id, tenant_id, action_type, target_module, risk_level, proof_required, review_required, status, payload)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [routePacket.rows[0].id, tenantId, route.intent, route.module, route.model_route.risk_level, route.model_route.proof_required, route.model_route.review_required, route.model_route.review_required ? 'needs_review' : 'ready', { message: body, context, route }]
  );

  const reply = assistantReply(intent);
  const assistantMessage = await db.query(
    `insert into connect_messages (thread_id, tenant_id, sender_type, sender_id, body, message_kind, route_decision, proof_state)
     values ($1,$2,'assistant','neroa_1',$3,'assistant_reply',$4,$5) returning *`,
    [thread.id, tenantId, reply, route, { proof_required: route.model_route.proof_required, status: route.model_route.proof_required ? 'proof_ready' : 'audit_only' }]
  );

  await db.query(
    `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata) values ($1,$2,$3,$4,$5)`,
    [payload.actor || 'neroa-connect', 'neroa_connect_message_routed', 'connect_thread', String(thread.id), { intent, route, actionPacketId: actionPacket.rows[0].id }]
  ).catch(() => null);

  return { thread, userMessage: userMessage.rows[0], assistantMessage: assistantMessage.rows[0], routePacket: routePacket.rows[0], actionPacket: actionPacket.rows[0], route };
}

export async function listConnectThreads(db, tenantId = DEFAULT_TENANT) {
  await ensureNeroaConnectSchema(db);
  const result = await db.query(`select * from connect_threads where tenant_id = $1 order by updated_at desc, id desc limit 50`, [tenantId]);
  return result.rows;
}

export async function getConnectThread(db, threadId) {
  await ensureNeroaConnectSchema(db);
  const thread = await db.query(`select * from connect_threads where id = $1`, [threadId]);
  if (!thread.rows[0]) return null;
  const messages = await db.query(`select * from connect_messages where thread_id = $1 order by id`, [threadId]);
  const packets = await db.query(`select * from connect_route_packets where thread_id = $1 order by id desc`, [threadId]);
  const actions = await db.query(`select cap.* from connect_action_packets cap join connect_route_packets crp on crp.id = cap.route_packet_id where crp.thread_id = $1 order by cap.id desc`, [threadId]);
  return { thread: thread.rows[0], messages: messages.rows, routePackets: packets.rows, actionPackets: actions.rows };
}

export function registerNeroaConnectRoutes(app, requireDatabase, ensureSchema) {
  app.get('/api/neroa/connect/health', async (req, res, next) => {
    try {
      await ensureSchema();
      await ensureNeroaConnectSchema(requireDatabase());
      res.json({ ok: true, module: 'Neroa Connect', entrypoint: 'Hi, I am Neroa. How may I help you?', activeFoundation: ['infra-canon', 'neroabase-core', 'runtime-proof'] });
    } catch (error) { next(error); }
  });

  app.get('/api/neroa/connect/threads', async (req, res, next) => {
    try {
      await ensureSchema();
      const threads = await listConnectThreads(requireDatabase(), req.query.tenantId || DEFAULT_TENANT);
      res.json({ ok: true, threads });
    } catch (error) { next(error); }
  });

  app.get('/api/neroa/connect/threads/:id', async (req, res, next) => {
    try {
      await ensureSchema();
      const thread = await getConnectThread(requireDatabase(), req.params.id);
      if (!thread) return res.status(404).json({ ok: false, error: 'Connect thread not found.' });
      res.json({ ok: true, ...thread });
    } catch (error) { next(error); }
  });

  app.post('/api/neroa/connect/message', async (req, res, next) => {
    try {
      await ensureSchema();
      const result = await createConnectMessage(requireDatabase(), req.body || {});
      res.json({ ok: true, ...result });
    } catch (error) { next(error); }
  });
}
