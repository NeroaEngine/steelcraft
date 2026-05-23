const proofLogKey = 'neroa_industry_pack_install_proofs_v1';

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function localHash(value) {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return Array.from({ length: 8 }, (_, index) => ((hash + index * 2654435761) >>> 0).toString(16).padStart(8, '0')).join('');
}

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function loadProofLog() {
  try {
    const saved = JSON.parse(localStorage.getItem(proofLogKey));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveProofLog(entries) {
  localStorage.setItem(proofLogKey, JSON.stringify(entries.slice(-50)));
}

export function getIndustryPackInstallProofLog() {
  return loadProofLog().slice().reverse();
}

export function createIndustryPackInstallProof({
  actor_id,
  actor_type = 'developer',
  tenant_id = 'steelcraft-default',
  tenant_name = 'Steel Craft',
  from_pack,
  to_pack,
  to_pack_title,
  business_identity_number = 'BIN-STEELCRAFT-001',
  business_address = 'trustnet:business:steelcraft-001',
  business_id = 'steelcraft',
  workspace_id = 'steelcraft-main',
  source_refs = ['source:developer-room:industry-pack-selector'],
  evidence_refs = ['evidence:developer-room:pack-install-click'],
  approval_refs = []
} = {}) {
  const blocked = [];
  if (isMissing(actor_id)) blocked.push('actor_id is missing');
  if (isMissing(to_pack)) blocked.push('industry pack is missing');
  if (isMissing(business_identity_number)) blocked.push('business_identity_number is missing');
  if (isMissing(business_address)) blocked.push('business_address is missing');
  if (isMissing(workspace_id)) blocked.push('workspace_id is missing');
  if (isMissing(source_refs)) blocked.push('source_refs are required');

  const now = new Date().toISOString();
  const event_type = blocked.length ? 'systems.policy.blocked' : 'systems.industry_pack.installed';
  const requested_event_type = 'systems.industry_pack.installed';
  const from_address = `trustnet:neroa-systems:${workspace_id}:${business_identity_number}:developer-room:${actor_type}:${actor_id || 'missing-actor'}`;
  const to_address = `trustnet:neroa-systems:${workspace_id}:${business_identity_number}:industry-pack:${to_pack || 'missing-pack'}`;
  const payload = { tenant_id, tenant_name, from_pack, to_pack, to_pack_title, source: 'developer_room_package_selector' };
  const payload_hash = localHash(payload);
  const event_id = `evt_pack_${localHash({ now, actor_id, to_pack, payload_hash }).slice(0, 20)}`;
  const receipt_id = `rcpt_pack_${localHash({ event_id, payload_hash, policy: blocked.join(';') }).slice(0, 24)}`;
  const lineage_id = `lin_pack_${localHash({ receipt_id, source_refs, evidence_refs, to_pack }).slice(0, 24)}`;

  const receipt = {
    event_id,
    event_type,
    requested_event_type,
    from_address,
    to_address,
    actor_type,
    actor_id: actor_id || null,
    business_identity_number,
    business_address,
    business_id,
    workspace_id,
    module_id: 'developer-room',
    payload_hash,
    payload_redaction_class: 'metadata_only',
    evidence_refs,
    source_refs,
    approval_refs,
    policy_result: blocked.length ? 'blocked' : 'allowed',
    policy_checks: blocked.length ? blocked.map((reason) => ({ status: 'blocked', reason })) : [{ status: 'passed', check: 'industry_pack_install_context' }],
    blocked_reason: blocked.join('; ') || null,
    auth_status: 'local_authenticated',
    signature_status: 'local_unsigned',
    timestamp: now,
    receipt_id,
    security_class: 'bank_level',
    retention_class: 'audit_7y',
    event_hash: localHash({ event_id, event_type, payload_hash, timestamp: now }),
    trust_layer: 'TrustNet',
    guard_layer: 'Neroa Guard',
    network_behavior: 'address_to_address_proof_audit_only'
  };

  const lineage = {
    lineage_id,
    repo: 'NeroaEngine/steelcraft',
    system_name: 'Neroa Systems',
    module_name: 'developer-room',
    action_id: `install-industry-pack:${to_pack || 'missing-pack'}`,
    event_id,
    receipt_id,
    source_refs,
    evidence_refs,
    approval_refs,
    business_refs: [business_identity_number || business_id].filter(Boolean),
    project_refs: [],
    customer_refs: [],
    redaction_class: 'metadata_only',
    retention_class: 'audit_7y',
    created_at: now,
    created_by_actor: actor_id || null,
    payload_hash,
    summary: `${to_pack_title || to_pack || 'Industry pack'} installed from Developer Room`,
    policy_result: receipt.policy_result,
    blocked_reason: receipt.blocked_reason,
    vault_layer: 'Neroa Vault',
    lineage_hash: localHash({ lineage_id, receipt_id, payload_hash, now })
  };

  const entry = { ok: !blocked.length, receipt, lineage, receipt_id, lineage_id, event_id, policy_result: receipt.policy_result, blocked_reason: receipt.blocked_reason };
  saveProofLog([...loadProofLog(), entry]);
  return entry;
}
