import crypto from 'node:crypto';

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export async function ensureIndustryPackSchema(db) {
  await db.query(`
    create table if not exists industry_pack_installs (
      id bigserial primary key,
      tenant_id text not null,
      tenant_name text,
      from_pack text,
      to_pack text not null,
      to_pack_title text,
      actor_type text,
      actor_id text,
      business_identity_number text not null,
      business_address text not null,
      business_id text,
      workspace_id text not null,
      receipt_id text not null unique,
      lineage_id text not null unique,
      event_id text not null unique,
      policy_result text not null,
      blocked_reason text,
      receipt jsonb not null,
      lineage jsonb not null,
      created_at timestamptz not null default now()
    );
  `);
}

function createPersistentInstallProof(input = {}) {
  const blocked = [];
  if (isMissing(input.actor_id)) blocked.push('actor_id is missing');
  if (isMissing(input.to_pack)) blocked.push('industry pack is missing');
  if (isMissing(input.business_identity_number)) blocked.push('business_identity_number is missing');
  if (isMissing(input.business_address)) blocked.push('business_address is missing');
  if (isMissing(input.workspace_id)) blocked.push('workspace_id is missing');
  if (isMissing(input.source_refs)) blocked.push('source_refs are required');

  const now = new Date().toISOString();
  const payload = {
    tenant_id: input.tenant_id,
    tenant_name: input.tenant_name,
    from_pack: input.from_pack || null,
    to_pack: input.to_pack,
    to_pack_title: input.to_pack_title || input.to_pack,
    source: 'developer_room_package_selector'
  };
  const payload_hash = sha256Hex(stableStringify(payload));
  const event_id = `evt_pack_${sha256Hex(`${now}:${input.actor_id}:${input.to_pack}:${payload_hash}`).slice(0, 20)}`;
  const receipt_id = `rcpt_pack_${sha256Hex(`${event_id}:${payload_hash}:${blocked.join(';')}`).slice(0, 24)}`;
  const lineage_id = `lin_pack_${sha256Hex(`${receipt_id}:${input.to_pack}:${stableStringify(input.source_refs || [])}`).slice(0, 24)}`;
  const event_type = blocked.length ? 'systems.policy.blocked' : 'systems.industry_pack.installed';

  const receipt = {
    event_id,
    event_type,
    requested_event_type: 'systems.industry_pack.installed',
    from_address: `trustnet:neroa-systems:${input.workspace_id || 'missing-workspace'}:${input.business_identity_number || 'missing-business'}:developer-room:${input.actor_type || 'developer'}:${input.actor_id || 'missing-actor'}`,
    to_address: `trustnet:neroa-systems:${input.workspace_id || 'missing-workspace'}:${input.business_identity_number || 'missing-business'}:industry-pack:${input.to_pack || 'missing-pack'}`,
    actor_type: input.actor_type || 'developer',
    actor_id: input.actor_id || null,
    business_identity_number: input.business_identity_number || null,
    business_address: input.business_address || null,
    business_id: input.business_id || null,
    workspace_id: input.workspace_id || null,
    module_id: 'developer-room',
    payload_hash,
    payload_redaction_class: 'metadata_only',
    evidence_refs: input.evidence_refs || ['evidence:developer-room:pack-install-click'],
    source_refs: input.source_refs || [],
    approval_refs: input.approval_refs || [],
    policy_result: blocked.length ? 'blocked' : 'allowed',
    policy_checks: blocked.length ? blocked.map((reason) => ({ status: 'blocked', reason })) : [{ status: 'passed', check: 'industry_pack_install_context' }],
    blocked_reason: blocked.join('; ') || null,
    auth_status: 'database_authenticated_path',
    signature_status: 'local_unsigned',
    timestamp: now,
    receipt_id,
    security_class: 'bank_level',
    retention_class: 'audit_7y',
    event_hash: sha256Hex(`${event_id}:${event_type}:${payload_hash}:${now}`),
    trust_layer: 'TrustNet',
    guard_layer: 'Neroa Guard',
    network_behavior: 'address_to_address_proof_audit_only'
  };

  const lineage = {
    lineage_id,
    repo: 'NeroaEngine/steelcraft',
    system_name: 'Neroa Systems',
    module_name: 'developer-room',
    action_id: `install-industry-pack:${input.to_pack || 'missing-pack'}`,
    event_id,
    receipt_id,
    source_refs: receipt.source_refs,
    evidence_refs: receipt.evidence_refs,
    approval_refs: receipt.approval_refs,
    business_refs: [input.business_identity_number || input.business_id].filter(Boolean),
    redaction_class: 'metadata_only',
    retention_class: 'audit_7y',
    created_at: now,
    created_by_actor: input.actor_id || null,
    payload_hash,
    summary: `${input.to_pack_title || input.to_pack || 'Industry pack'} installed from Developer Room`,
    policy_result: receipt.policy_result,
    blocked_reason: receipt.blocked_reason,
    vault_layer: 'Neroa Vault',
    lineage_hash: sha256Hex(`${lineage_id}:${receipt_id}:${payload_hash}:${now}`)
  };

  return { ok: !blocked.length, receipt, lineage, receipt_id, lineage_id, event_id, policy_result: receipt.policy_result, blocked_reason: receipt.blocked_reason };
}

export function registerIndustryPackRoutes(app, requireDatabase, ensureSchema) {
  app.post('/api/industry-packs/install', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const body = req.body || {};
      const proof = createPersistentInstallProof({
        actor_type: body.actor_type || 'developer',
        actor_id: body.actor_id,
        tenant_id: body.tenant_id || 'steelcraft-default',
        tenant_name: body.tenant_name || 'Steel Craft',
        from_pack: body.from_pack || null,
        to_pack: body.to_pack,
        to_pack_title: body.to_pack_title,
        business_identity_number: body.business_identity_number || 'BIN-STEELCRAFT-001',
        business_address: body.business_address || 'trustnet:business:steelcraft-001',
        business_id: body.business_id || 'steelcraft',
        workspace_id: body.workspace_id || 'steelcraft-main',
        source_refs: body.source_refs || ['source:developer-room:industry-pack-selector'],
        evidence_refs: body.evidence_refs || ['evidence:developer-room:pack-install-click'],
        approval_refs: body.approval_refs || []
      });

      await db.query(
        `insert into industry_pack_installs (tenant_id, tenant_name, from_pack, to_pack, to_pack_title, actor_type, actor_id, business_identity_number, business_address, business_id, workspace_id, receipt_id, lineage_id, event_id, policy_result, blocked_reason, receipt, lineage)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [body.tenant_id || 'steelcraft-default', body.tenant_name || 'Steel Craft', body.from_pack || null, body.to_pack, body.to_pack_title || body.to_pack, body.actor_type || 'developer', body.actor_id || null, body.business_identity_number || 'BIN-STEELCRAFT-001', body.business_address || 'trustnet:business:steelcraft-001', body.business_id || 'steelcraft', body.workspace_id || 'steelcraft-main', proof.receipt_id, proof.lineage_id, proof.event_id, proof.policy_result, proof.blocked_reason, proof.receipt, proof.lineage]
      );

      await db.query(
        `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata) values ($1,$2,$3,$4,$5)`,
        [body.actor_id || 'developer', proof.ok ? 'industry_pack_installed_with_receipt' : 'industry_pack_install_blocked', 'industry_pack', body.to_pack || 'missing-pack', { receipt_id: proof.receipt_id, lineage_id: proof.lineage_id, policy_result: proof.policy_result }]
      );

      res.status(proof.ok ? 200 : 400).json(proof);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/industry-packs/proof-log', async (req, res, next) => {
    try {
      await ensureSchema();
      const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));
      const result = await requireDatabase().query(
        `select id, tenant_id, tenant_name, from_pack, to_pack, to_pack_title, actor_id, receipt_id, lineage_id, event_id, policy_result, blocked_reason, receipt, lineage, created_at
         from industry_pack_installs order by created_at desc limit $1`,
        [limit]
      );
      res.json({ ok: true, installs: result.rows });
    } catch (error) {
      next(error);
    }
  });
}
