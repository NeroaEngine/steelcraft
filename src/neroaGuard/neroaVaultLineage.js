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

const VAULT_REDACTION_CLASSES = new Set([
  'hash_only',
  'metadata_only',
  'redacted_summary',
  'private_internal',
  'customer_safe_projection',
  'raw_sensitive_internal'
]);

const VAULT_RETENTION_CLASSES = new Set([
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
  'sensitive financial',
  'raw financial',
  'message body'
];

function containsSensitive(value) {
  const haystack = stableStringify(value ?? {}).toLowerCase();
  return SENSITIVE_TERMS.find((term) => haystack.includes(term));
}

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function validateVaultLineageRecord(input = {}) {
  const policyChecks = [];
  const blockedReasons = [];
  const fail = (check, reason) => {
    policyChecks.push({ check, status: 'blocked', reason });
    blockedReasons.push(reason);
  };
  const pass = (check) => policyChecks.push({ check, status: 'passed' });

  if (isMissing(input.repo)) fail('repo_required', 'repo is missing'); else pass('repo_required');
  if (isMissing(input.system_name)) fail('system_name_required', 'system_name is missing'); else pass('system_name_required');
  if (isMissing(input.action_id)) fail('action_id_required', 'action_id is missing'); else pass('action_id_required');
  if (isMissing(input.created_by_actor)) fail('created_by_actor_required', 'created_by_actor is missing'); else pass('created_by_actor_required');
  if (!VAULT_REDACTION_CLASSES.has(input.redaction_class)) fail('valid_redaction_class', 'redaction_class is invalid'); else pass('valid_redaction_class');
  if (!VAULT_RETENTION_CLASSES.has(input.retention_class)) fail('valid_retention_class', 'retention_class is invalid'); else pass('valid_retention_class');

  if (input.source_required === true && isMissing(input.source_refs)) fail('source_refs_required', 'source-backed lineage has no source_refs'); else pass('source_refs_required');
  if (input.receipt_id && isMissing(input.event_id)) fail('receipt_links_event', 'lineage record with receipt_id must include event_id'); else pass('receipt_links_event');
  if (input.cross_user_access === true || input.cross_customer_access === true || input.cross_workspace_access === true) fail('no_cross_boundary_memory', 'memory refs cross user/customer/workspace boundaries'); else pass('no_cross_boundary_memory');

  const sensitiveTerm = containsSensitive(input.notes || input.summary || input.payload || {});
  if (input.redaction_class === 'customer_safe_projection' && sensitiveTerm) {
    fail('customer_safe_no_sensitive_data', `customer-safe lineage attempted to expose sensitive data: ${sensitiveTerm}`);
  } else pass('customer_safe_no_sensitive_data');

  let payloadHash = input.payload_hash;
  try {
    payloadHash ||= createPayloadHash({
      memory_refs: input.memory_refs || [],
      source_refs: input.source_refs || [],
      decision_refs: input.decision_refs || [],
      approval_refs: input.approval_refs || [],
      evidence_refs: input.evidence_refs || [],
      summary: input.summary || null
    });
    if (isMissing(payloadHash)) throw new Error('empty hash');
    pass('payload_hash_created');
  } catch {
    fail('payload_hash_created', 'payload_hash cannot be created');
  }

  return {
    allowed: blockedReasons.length === 0,
    policy_result: blockedReasons.length === 0 ? 'allowed' : 'blocked',
    blockedReasons,
    policyChecks,
    payloadHash
  };
}

export function createVaultLineageRecord(input = {}) {
  const validation = validateVaultLineageRecord(input);
  const createdAt = input.created_at || new Date().toISOString();
  const lineageId = input.lineage_id || `lin_${sha256Hex(`${createdAt}:${input.repo}:${input.action_id}:${validation.payloadHash}`).slice(0, 24)}`;
  const record = {
    lineage_id: lineageId,
    repo: input.repo || null,
    system_name: input.system_name || null,
    module_name: input.module_name || null,
    action_id: input.action_id || null,
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
    created_at: createdAt,
    created_by_actor: input.created_by_actor || null,
    payload_hash: validation.payloadHash || null,
    notes: input.notes || null,
    summary: input.summary || null,
    policy_result: validation.policy_result,
    policy_checks: validation.policyChecks,
    blocked_reason: validation.blockedReasons.join('; ') || null,
    vault_layer: NEROA_VAULT_LAYER
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
    linkAction(input) {
      return store.append(input);
    },
    linkReceipt({ receipt, ...input }) {
      return store.append({
        ...input,
        event_id: input.event_id || receipt?.event_id,
        receipt_id: input.receipt_id || receipt?.receipt_id,
        source_refs: input.source_refs || receipt?.source_refs || [],
        approval_refs: input.approval_refs || receipt?.approval_refs || [],
        evidence_refs: input.evidence_refs || receipt?.evidence_refs || [],
        redaction_class: input.redaction_class || receipt?.payload_redaction_class || 'metadata_only',
        retention_class: input.retention_class || receipt?.retention_class || 'audit_7y',
        payload_hash: input.payload_hash || receipt?.payload_hash
      });
    }
  };
}
