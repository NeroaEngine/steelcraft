import { createPayloadHash, sha256Hex, stableStringify } from './trustNetGuard.js';

export const NEROA_VAULT_LAYER = 'Neroa Vault';

export const SYSTEMS_VAULT_LINEAGE_EVENTS = Object.freeze([
  'systems.action.linked_to_vault',
  'systems.customer.linked_to_vault',
  'systems.vendor.linked_to_vault',
  'systems.contact.linked_to_vault',
  'systems.order.linked_to_vault',
  'systems.production.linked_to_vault',
  'systems.purchase_order.linked_to_vault',
  'systems.fulfillment.linked_to_vault',
  'systems.shipment.linked_to_vault',
  'systems.logistics.linked_to_vault',
  'systems.invoice.linked_to_vault',
  'systems.payment.linked_to_vault',
  'systems.accounting.linked_to_vault',
  'systems.reconciliation.linked_to_vault',
  'systems.business_decision.linked_to_vault',
  'systems.communication.linked_to_vault',
  'systems.sop.linked_to_vault',
  'systems.audit_report.linked_to_vault',
  'systems.assistant_action.linked_to_vault',
  'systems.receipt.linked_to_vault'
]);

const LINEAGE_REDACTION_CLASSES = Object.freeze([
  'hash_only',
  'metadata_only',
  'redacted_summary',
  'private_internal',
  'customer_safe_projection',
  'raw_sensitive_internal'
]);

const LINEAGE_RETENTION_CLASSES = Object.freeze([
  'operational_30d',
  'business_1y',
  'audit_7y',
  'legal_hold',
  'security_indefinite'
]);

const SENSITIVE_TERMS = [
  'secret',
  'private key',
  'credential',
  'password',
  'bank account',
  'routing number',
  'account number',
  'payroll',
  'ssn',
  'social security',
  'protected customer data',
  'raw financial',
  'sensitive financial',
  'message body'
];

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function containsSensitive(value) {
  const haystack = stableStringify(value ?? {}).toLowerCase();
  return SENSITIVE_TERMS.find((term) => haystack.includes(term));
}

export function validateVaultLineageRecord(input = {}) {
  const checks = [];
  const blockedReasons = [];
  const fail = (check, reason) => {
    checks.push({ check, status: 'blocked', reason });
    blockedReasons.push(reason);
  };
  const pass = (check) => checks.push({ check, status: 'passed' });

  if (isMissing(input.repo)) fail('repo_required', 'repo is missing'); else pass('repo_required');
  if (isMissing(input.system_name)) fail('system_name_required', 'system_name is missing'); else pass('system_name_required');
  if (isMissing(input.action_id)) fail('action_id_required', 'action_id is missing'); else pass('action_id_required');
  if (isMissing(input.created_by_actor)) fail('created_by_actor_required', 'created_by_actor is missing'); else pass('created_by_actor_required');

  if (!LINEAGE_REDACTION_CLASSES.includes(input.redaction_class)) fail('valid_redaction_class', 'redaction_class is invalid'); else pass('valid_redaction_class');
  if (!LINEAGE_RETENTION_CLASSES.includes(input.retention_class)) fail('valid_retention_class', 'retention_class is invalid'); else pass('valid_retention_class');

  let payloadHash = input.payload_hash;
  try {
    payloadHash ||= createPayloadHash(input.payload ?? { summary: input.summary || input.notes || null });
    if (isMissing(payloadHash)) throw new Error('empty hash');
    pass('payload_hash_created');
  } catch {
    fail('payload_hash_created', 'payload_hash cannot be created');
  }

  if (input.receipt_id && isMissing(input.event_id)) fail('event_id_required_with_receipt', 'lineage record with receipt_id must include event_id');
  else pass('event_id_required_with_receipt');

  if (input.cross_user_memory_ref === true || input.cross_customer_memory_ref === true || input.cross_workspace_memory_ref === true) {
    fail('no_cross_boundary_memory_refs', 'memory refs cross user/customer/workspace boundaries');
  } else pass('no_cross_boundary_memory_refs');

  const sensitiveTerm = containsSensitive({ payload: input.payload, notes: input.notes, summary: input.summary });
  if (input.redaction_class === 'customer_safe_projection' && sensitiveTerm) {
    fail('customer_safe_no_sensitive_lineage', `customer-safe lineage attempted to expose sensitive data: ${sensitiveTerm}`);
  } else pass('customer_safe_no_sensitive_lineage');

  if (input.source_backed_action === true && isMissing(input.source_refs)) fail('source_refs_required', 'source-backed lineage has no source_refs');
  else pass('source_refs_required');

  return {
    allowed: blockedReasons.length === 0,
    policy_result: blockedReasons.length === 0 ? 'allowed' : 'blocked',
    blockedReasons,
    policyChecks: checks,
    payloadHash
  };
}

export function createVaultLineageRecord(input = {}) {
  const validation = validateVaultLineageRecord(input);
  const now = input.created_at || new Date().toISOString();
  const actionId = input.action_id || `action_${sha256Hex(`${now}:${input.module_name}:${input.event_id || ''}`).slice(0, 16)}`;
  const lineageId = input.lineage_id || `vlt_${sha256Hex(`${input.repo}:${input.system_name}:${actionId}:${validation.payloadHash}`).slice(0, 24)}`;

  const record = {
    lineage_id: lineageId,
    repo: input.repo || null,
    system_name: input.system_name || null,
    module_name: input.module_name || null,
    action_id: actionId,
    event_id: input.event_id || null,
    receipt_id: input.receipt_id || null,
    memory_refs: input.memory_refs || [],
    source_refs: input.source_refs || [],
    decision_refs: input.decision_refs || [],
    approval_refs: input.approval_refs || [],
    evidence_refs: input.evidence_refs || [],
    prompt_refs: input.prompt_refs || [],
    project_refs: input.project_refs || [],
    customer_refs: input.customer_refs || [],
    business_refs: input.business_refs || [],
    thread_refs: input.thread_refs || [],
    message_refs: input.message_refs || [],
    order_refs: input.order_refs || [],
    job_refs: input.job_refs || [],
    vendor_refs: input.vendor_refs || [],
    shipment_refs: input.shipment_refs || [],
    invoice_refs: input.invoice_refs || [],
    payment_refs: input.payment_refs || [],
    accounting_refs: input.accounting_refs || [],
    redaction_class: input.redaction_class || null,
    retention_class: input.retention_class || null,
    created_at: now,
    created_by_actor: input.created_by_actor || null,
    payload_hash: validation.payloadHash || null,
    notes: input.notes || null,
    summary: input.summary || null,
    policy_result: validation.policy_result,
    policy_checks: validation.policyChecks,
    blocked_reason: validation.blockedReasons.join('; ') || null,
    vault_layer: NEROA_VAULT_LAYER,
    local_only: true
  };

  return {
    ...record,
    lineage_hash: sha256Hex(stableStringify(record))
  };
}

export class LocalVaultLineageStore {
  constructor({ seedRecords = [] } = {}) {
    this.records = [...seedRecords];
  }

  append(input) {
    const record = createVaultLineageRecord(input);
    this.records.push(record);
    return record;
  }

  all() {
    return [...this.records];
  }

  findByLineageId(lineageId) {
    return this.records.find((record) => record.lineage_id === lineageId) || null;
  }

  findByReceiptId(receiptId) {
    return this.records.filter((record) => record.receipt_id === receiptId);
  }
}

export function createLocalVaultLineageAdapter({ store = new LocalVaultLineageStore() } = {}) {
  return {
    store,
    createLineage(input) {
      return store.append(input);
    },
    linkReceipt({ receipt, repo = 'NeroaEngine/steelcraft', system_name = 'Neroa Systems', module_name, action_id, ...rest } = {}) {
      return store.append({
        repo,
        system_name,
        module_name: module_name || receipt?.module_id || null,
        action_id: action_id || receipt?.event_id || undefined,
        event_id: receipt?.event_id,
        receipt_id: receipt?.receipt_id,
        source_refs: receipt?.source_refs || [],
        approval_refs: receipt?.approval_refs || [],
        evidence_refs: receipt?.evidence_refs || [],
        business_refs: receipt?.business_id ? [receipt.business_id] : [],
        customer_refs: receipt?.customer_id ? [receipt.customer_id] : [],
        project_refs: receipt?.project_id ? [receipt.project_id] : [],
        order_refs: receipt?.order_id ? [receipt.order_id] : [],
        job_refs: receipt?.job_id ? [receipt.job_id] : [],
        vendor_refs: receipt?.vendor_id ? [receipt.vendor_id] : [],
        shipment_refs: receipt?.shipment_id ? [receipt.shipment_id] : [],
        invoice_refs: receipt?.accounting_id ? [receipt.accounting_id] : [],
        accounting_refs: receipt?.accounting_id ? [receipt.accounting_id] : [],
        redaction_class: receipt?.payload_redaction_class || 'metadata_only',
        retention_class: receipt?.retention_class || 'audit_7y',
        created_by_actor: receipt?.actor_id || 'system',
        payload_hash: receipt?.payload_hash,
        summary: `Linked ${receipt?.event_type || 'event'} receipt to Neroa Vault lineage`,
        ...rest
      });
    }
  };
}
