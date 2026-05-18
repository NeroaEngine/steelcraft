const DEFAULT_TENANT = 'steelcraft-demo';
const memoryThreads = [];
const memoryMessages = [];
const memoryRoutes = [];
const memoryActions = [];

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
  if (context && context.currentRoom) return 'room_context_help';
  return 'general_help';
}

function routeDecision(intent, message = '') {
  const highRisk = ['approval_flow', 'comptroller_accounting'];
  const customerWaiting = true;
  return {
    intent,
    surface: 'neroa_connect',
    module: intent === 'setup_assistant' ? 'neroa_erp.setup' : intent === 'comptroller_accounting' ? 'neroa_erp.comptroller' : 'neroa_connect.help',
    model_route: {
      default_model: 'Neroa Mini',
      escalation_model: highRisk.includes(intent) ? 'Neroa 5.4' : 'Neroa 5.4 if uncertain',
      live_or_batch: customerWaiting ? 'live' : 'batch',
      batch_eligible: false,
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
  if (intent === 'setup_assistant') return 'I can help set this up. Upload or connect the customer list, vendor list, bank feed, QuickBooks if used, tax location, fixed costs, daily report time, and approval recipients.';
  if (intent === 'approval_flow') return 'I can route this as an approval thread and keep it proof-ready before any action is posted.';
  if (intent === 'comptroller_accounting') return 'I can open the Comptroller lane, explain what was matched, show the ledger account, flag exceptions, and wait for owner approval before posting.';
  if (intent === 'video_support') return 'I can prepare a Neroa Video support path and create the Connect thread.';
  if (intent === 'help_support') return 'I can help from SOPs, ERP context, or support routing.';
  return 'Hi, I am Neroa. I can help with setup, accounting, customer messages, vendor messages, approvals, SOPs, support, or routing this to the right ERP record.';
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(collection) {
  return collection.length + 1;
}

export async function ensureNeroaConnectSchema() {
  // Runtime stabilization: do not block app boot or login on new Connect DDL.
  // Durable PostgreSQL tables will move behind a controlled migration after UI runtime is stable.
  return true;
}

export async function createConnectMessage(db, payload = {}) {
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
  const threadId = Number(payload.threadId || 0) || makeId(memoryThreads);
  let thread = memoryThreads.find((item) => item.id === threadId);
  if (!thread) {
    thread = {
      id: threadId,
      tenant_id: tenantId,
      thread_type: payload.threadType || intent,
      title: payload.title || (intent === 'setup_assistant' ? 'Neroa Setup Assistant' : intent === 'comptroller_accounting' ? 'Neroa Comptroller' : 'Neroa Help'),
      status: 'open',
      created_by: payload.actor || payload.userId || 'user',
      context,
      route_state: route,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    memoryThreads.unshift(thread);
  } else {
    thread.updated_at = nowIso();
    thread.route_state = route;
  }

  const userMessage = {
    id: makeId(memoryMessages),
    thread_id: thread.id,
    tenant_id: tenantId,
    sender_type: 'user',
    sender_id: payload.actor || payload.userId || 'user',
    body,
    message_kind: 'message',
    route_decision: route,
    proof_state: { proof_required: route.model_route.proof_required, status: 'captured' },
    created_at: nowIso()
  };
  memoryMessages.push(userMessage);

  const routePacket = {
    id: makeId(memoryRoutes),
    thread_id: thread.id,
    message_id: userMessage.id,
    tenant_id: tenantId,
    intent: route.intent,
    module: route.module,
    route_decision: route,
    status: 'ready',
    created_at: nowIso()
  };
  memoryRoutes.push(routePacket);

  const actionPacket = {
    id: makeId(memoryActions),
    route_packet_id: routePacket.id,
    tenant_id: tenantId,
    action_type: route.intent,
    target_module: route.module,
    risk_level: route.model_route.risk_level,
    proof_required: route.model_route.proof_required,
    review_required: route.model_route.review_required,
    status: route.model_route.review_required ? 'needs_review' : 'ready',
    payload: { message: body, context, route },
    created_at: nowIso()
  };
  memoryActions.push(actionPacket);

  const assistantMessage = {
    id: makeId(memoryMessages),
    thread_id: thread.id,
    tenant_id: tenantId,
    sender_type: 'assistant',
    sender_id: 'neroa_1',
    body: assistantReply(intent),
    message_kind: 'assistant_reply',
    route_decision: route,
    proof_state: { proof_required: route.model_route.proof_required, status: route.model_route.proof_required ? 'proof_ready' : 'audit_only' },
    created_at: nowIso()
  };
  memoryMessages.push(assistantMessage);

  if (db && typeof db.query === 'function') {
    db.query(
      `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata) values ($1,$2,$3,$4,$5)`,
      [payload.actor || 'neroa-connect', 'neroa_connect_message_routed_memory', 'connect_thread', String(thread.id), { intent, route, actionPacketId: actionPacket.id }]
    ).catch(() => null);
  }

  return { thread, userMessage, assistantMessage, routePacket, actionPacket, route };
}

export async function listConnectThreads() {
  return memoryThreads.slice(0, 50);
}

export async function getConnectThread(db, threadId) {
  const id = Number(threadId);
  const thread = memoryThreads.find((item) => item.id === id);
  if (!thread) return null;
  return {
    thread,
    messages: memoryMessages.filter((item) => item.thread_id === id),
    routePackets: memoryRoutes.filter((item) => item.thread_id === id).reverse(),
    actionPackets: memoryActions.filter((action) => memoryRoutes.some((route) => route.id === action.route_packet_id && route.thread_id === id)).reverse()
  };
}

export function registerNeroaConnectRoutes(app, requireDatabase) {
  app.get('/api/neroa/connect/health', async (req, res, next) => {
    try {
      res.json({ ok: true, module: 'Neroa Connect', mode: 'stabilized-memory-runtime', entrypoint: 'Hi, I am Neroa. How may I help you?', activeFoundation: ['infra-canon', 'neroabase-core', 'runtime-proof'] });
    } catch (error) { next(error); }
  });

  app.get('/api/neroa/connect/threads', async (req, res, next) => {
    try {
      const threads = await listConnectThreads();
      res.json({ ok: true, threads });
    } catch (error) { next(error); }
  });

  app.get('/api/neroa/connect/threads/:id', async (req, res, next) => {
    try {
      const thread = await getConnectThread(null, req.params.id);
      if (!thread) return res.status(404).json({ ok: false, error: 'Connect thread not found.' });
      res.json({ ok: true, ...thread });
    } catch (error) { next(error); }
  });

  app.post('/api/neroa/connect/message', async (req, res, next) => {
    try {
      const db = (() => { try { return requireDatabase && requireDatabase(); } catch { return null; } })();
      const result = await createConnectMessage(db, req.body || {});
      res.json({ ok: true, ...result });
    } catch (error) { next(error); }
  });
}
