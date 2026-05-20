import crypto from 'node:crypto';

export const NEROA_GUARD_PRODUCT_LAYER = 'Neroa Guard';
export const TRUSTNET_LAYER = 'TrustNet';

export const TRUSTNET_EVENT_FAMILIES = Object.freeze([
  'systems.action.requested',
  'systems.action.approved',
  'systems.action.blocked',
  'systems.worker.started',
  'systems.worker.completed',
  'systems.worker.failed',
  'systems.customer.created',
  'systems.customer.updated',
  'systems.vendor.created',
  'systems.vendor.updated',
  'systems.contact.created',
  'systems.crm_action.completed',
  'systems.order.created',
  'systems.order.updated',
  'systems.order.blocked',
  'systems.production.started',
  'systems.production.updated',
  'systems.production.completed',
  'systems.purchase_order.created',
  'systems.purchase_order.updated',
  'systems.fulfillment.started',
  'systems.fulfillment.completed',
  'systems.fulfillment.blocked',
  'systems.shipment.created',
  'systems.shipment.updated',
  'systems.logistics.started',
  'systems.logistics.completed',
  'systems.invoice.created',
  'systems.invoice.updated',
  'systems.payment.recorded',
  'systems.accounting.reconciliation_started',
  'systems.accounting.reconciliation_completed',
  'systems.accounting.reconciliation_blocked',
  'systems.costing.calculated',
  'systems.margin.warning_created',
  'systems.business_decision.recommended',
  'systems.business_decision.approved',
  'systems.business_decision.blocked',
  'systems.communication.drafted',
  'systems.communication.sent',
  'systems.communication.blocked',
  'systems.audit_report.created',
  'systems.sop.created',
  'systems.sop.updated',
  'systems.assistant.action_started',
  'systems.assistant.action_completed',
  'systems.assistant.action_blocked',
  'systems.database.created',
  'systems.schema.migration.started',
  'systems.schema.migration.completed',
  'systems.schema.migration.failed',
  'systems.table.created',
  'systems.policy.changed',
  'systems.sensitive_query.requested',
  'systems.sensitive_query.allowed',
  'systems.sensitive_query.blocked',
  'systems.data_export.requested',
  'systems.data_export.completed',
  'systems.data_export.blocked',
  'systems.backup.created',
  'systems.restore.requested',
  'systems.restore.completed',
  'systems.tenant_data_accessed',
  'systems.customer_data_accessed',
  'systems.policy.blocked'
]);

export const TRUSTNET_REDACTION_CLASSES = Object.freeze([
  'hash_only',
  'metadata_only',
  'redacted_summary',
  'private_internal',
  'customer_safe_projection',
  'raw_sensitive_internal'
]);

export const TRUSTNET_SECURITY_CLASSES = Object.freeze([
  'public_operational',
  'customer_safe',
  'internal',
  'sensitive',
  'regulated',
  'bank_level'
]);

export const TRUSTNET_RETENTION_CLASSES = Object.freeze([
  'operational_30d',
  'business_1y',
  'audit_7y',
  'legal_hold',
  'security_indefinite'
]);

const BLOCKED_BEHAVIOR_TERMS = [
  'wallet',
  'token',
  'custody',
  'bridge',
  'mainnet',
  'gas',
  'coin',
  'public-chain',
  'public chain'
];

const SENSITIVE_EXPOSURE_TERMS = [
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

const CUSTOMER_SAFE_ALLOWED = new Set(['hash_only', 'metadata_only', 'redacted_summary', 'customer_safe_projection']);
const APPROVAL_REQUIRED_EVENT_TYPES = new Set([
  'systems.action.approved',
  'systems.order.updated',
  'systems.production.updated',
  'systems.purchase_order.created',
  'systems.purchase_order.updated',
  'systems.fulfillment.completed',
  'systems.shipment.created',
  'systems.shipment.updated',
  'systems.logistics.completed',
  'systems.invoice.created',
  'systems.invoice.updated',
  'systems.payment.recorded',
  'systems.accounting.reconciliation_completed',
  'systems.business_decision.approved',
  'systems.communication.sent',
  'systems.audit_report.created',
  'systems.sop.updated',
  'systems.assistant.action_completed',
  'systems.schema.migration.completed',
  'systems.data_export.completed',
  'systems.restore.completed'
]);
const SOURCE_REQUIRED_EVENT_TYPES = new Set([
  'systems.assistant.action_completed',
  'systems.business_decision.recommended',
  'systems.business_decision.approved',
  'systems.costing.calculated',
  'systems.margin.warning_created',
  'systems.accounting.reconciliation_completed',
  'systems.communication.drafted',
  'systems.communication.sent',
  'systems.audit_report.created'
]);
const CUSTOMER_IMPACTING_EVENT_TYPES = new Set([
  'systems.customer.created',
  'systems.customer.updated',
  'systems.vendor.created',
  'systems.vendor.updated',
  'systems.contact.created',
  'systems.crm_action.completed',
  'systems.order.created',
  'systems.order.updated',
  'systems.production.updated',
  'systems.purchase_order.created',
  'systems.purchase_order.updated',
  'systems.fulfillment.completed',
  'systems.shipment.created',
  'systems.shipment.updated',
  'systems.invoice.created',
  'systems.invoice.updated',
  'systems.payment.recorded',
  'systems.accounting.reconciliation_completed',
  'systems.communication.sent'
]);
const BUSINESS_IDENTITY_REQUIRED_EVENT_TYPES = new Set([
  ...CUSTOMER_IMPACTING_EVENT_TYPES,
  'systems.worker.started',
  'systems.worker.completed',
  'systems.worker.failed',
  'systems.assistant.action_started',
  'systems.assistant.action_completed',
  'systems.assistant.action_blocked',
  'systems.audit_report.created',
  'systems.sop.created',
  'systems.sop.updated'
]);

export function trustAddress({ system = 'neroa-systems', workspace_id, business_id, business_identity_number, actor_type, actor_id, module_id } = {}) {
  const parts = [system, workspace_id, business_identity_number || business_id, module_id, actor_type, actor_id]
    .filter(Boolean)
    .map((part) => String(part).trim().toLowerCase().replace(/[^a-z0-9_.:-]+/g, '-'));
  return `trustnet:${parts.join(':') || 'unknown'}`;
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function createPayloadHash(payload) {
  return sha256Hex(stableStringify(payload ?? {}));
}

export function createEventHash(receipt) {
  const hashable = { ...receipt };
  delete hashable.event_hash;
  delete hashable.receipt_hash;
  return sha256Hex(stableStringify(hashable));
}

function containsTerm(value, terms) {
  const haystack = stableStringify(value ?? {}).toLowerCase();
  return terms.find((term) => haystack.includes(term));
}

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function validateTrustNetRequest(input = {}) {
  const policyChecks = [];
  const fail = (check, reason) => {
    policyChecks.push({ check, status: 'blocked', reason });
    return reason;
  };
  const pass = (check) => policyChecks.push({ check, status: 'passed' });

  const eventType = input.event_type;
  const blockedReasons = [];

  if (!TRUSTNET_EVENT_FAMILIES.includes(eventType)) blockedReasons.push(fail('known_event_type', 'event_type is unknown'));
  else pass('known_event_type');

  if (isMissing(input.from_address)) blockedReasons.push(fail('from_address_required', 'from_address is missing'));
  else pass('from_address_required');

  if (isMissing(input.to_address)) blockedReasons.push(fail('to_address_required', 'to_address is missing'));
  else pass('to_address_required');

  if (isMissing(input.actor_type) || isMissing(input.actor_id)) blockedReasons.push(fail('actor_identity_required', 'actor identity is missing'));
  else pass('actor_identity_required');

  if (CUSTOMER_IMPACTING_EVENT_TYPES.has(eventType)) {
    if (isMissing(input.business_id) || isMissing(input.workspace_id)) {
      blockedReasons.push(fail('business_context_required', 'required business/workspace context is missing'));
    } else pass('business_context_required');
  } else pass('business_context_required');

  if (BUSINESS_IDENTITY_REQUIRED_EVENT_TYPES.has(eventType)) {
    if (isMissing(input.business_identity_number) || isMissing(input.business_address)) {
      blockedReasons.push(fail('business_identity_required', 'business_identity_number or business_address is missing'));
    } else pass('business_identity_required');
  } else pass('business_identity_required');

  if (!TRUSTNET_REDACTION_CLASSES.includes(input.payload_redaction_class)) blockedReasons.push(fail('valid_redaction_class', 'payload_redaction_class is invalid'));
  else pass('valid_redaction_class');

  if (!TRUSTNET_SECURITY_CLASSES.includes(input.security_class)) blockedReasons.push(fail('valid_security_class', 'security_class is invalid'));
  else pass('valid_security_class');

  if (!TRUSTNET_RETENTION_CLASSES.includes(input.retention_class)) blockedReasons.push(fail('valid_retention_class', 'retention_class is invalid'));
  else pass('valid_retention_class');

  let payloadHash = input.payload_hash;
  try {
    payloadHash ||= createPayloadHash(input.payload);
    if (isMissing(payloadHash)) throw new Error('empty hash');
    pass('payload_hash_created');
  } catch {
    blockedReasons.push(fail('payload_hash_created', 'payload_hash cannot be created'));
  }

  if (APPROVAL_REQUIRED_EVENT_TYPES.has(eventType) && isMissing(input.approval_refs)) {
    blockedReasons.push(fail('approval_required', 'approval-required action has no approval_ref'));
  } else pass('approval_required');

  if (SOURCE_REQUIRED_EVENT_TYPES.has(eventType) && isMissing(input.source_refs)) {
    blockedReasons.push(fail('source_refs_required', 'source-backed action has no source_ref'));
  } else pass('source_refs_required');

  const prohibitedTerm = containsTerm(input, BLOCKED_BEHAVIOR_TERMS);
  if (prohibitedTerm) blockedReasons.push(fail('no_public_crypto_behavior', `action attempts prohibited public crypto behavior: ${prohibitedTerm}`));
  else pass('no_public_crypto_behavior');

  const sensitiveTerm = containsTerm(input.payload, SENSITIVE_EXPOSURE_TERMS);
  if (input.payload_redaction_class === 'customer_safe_projection' && sensitiveTerm) {
    blockedReasons.push(fail('customer_safe_no_sensitive_data', `customer-safe receipt attempted to expose sensitive data: ${sensitiveTerm}`));
  } else if (input.payload_redaction_class && !CUSTOMER_SAFE_ALLOWED.has(input.payload_redaction_class) && input.customer_safe === true) {
    blockedReasons.push(fail('customer_safe_no_sensitive_data', 'customer_safe receipt requires a customer-safe redaction class'));
  } else pass('customer_safe_no_sensitive_data');

  if (input.cross_user_access === true || input.cross_customer_access === true || input.cross_workspace_access === true) blockedReasons.push(fail('no_cross_boundary_access', 'action attempts cross-user, cross-customer, or cross-workspace data access'));
  else pass('no_cross_boundary_access');

  if (input.uncontrolled_model_chatter === true) blockedReasons.push(fail('no_uncontrolled_model_chatter', 'action attempts uncontrolled model-to-model chatter'));
  else pass('no_uncontrolled_model_chatter');

  if (input.uncontrolled_production_execution === true) blockedReasons.push(fail('no_uncontrolled_production_execution', 'action attempts uncontrolled production execution'));
  else pass('no_uncontrolled_production_execution');

  if (input.customer_impacting_change === true && isMissing(input.approval_refs) && input.policy_override !== 'approval_not_required') {
    blockedReasons.push(fail('customer_impacting_changes_need_approval', 'customer-impacting change has no approval or policy path'));
  } else pass('customer_impacting_changes_need_approval');

  if (input.source_backed_action === true && isMissing(input.source_refs)) {
    blockedReasons.push(fail('source_backed_actions_need_sources', 'source-backed action has no source_refs'));
  } else pass('source_backed_actions_need_sources');

  if (input.bypass_neroa_policy === true) blockedReasons.push(fail('no_policy_bypass', 'action attempts to bypass Neroa One Brain, Neroa Core policy, Neroa Guard, or Neroa Vault rules'));
  else pass('no_policy_bypass');

  return {
    allowed: blockedReasons.length === 0,
    policy_result: blockedReasons.length === 0 ? 'allowed' : 'blocked',
    blockedReasons,
    policyChecks,
    payloadHash
  };
}

export function createTrustNetReceipt(input = {}, options = {}) {
  const validation = validateTrustNetRequest(input);
  const now = input.timestamp || new Date().toISOString();
  const eventId = input.event_id || `evt_${sha256Hex(`${now}:${input.event_type}:${input.actor_id}:${validation.payloadHash}`).slice(0, 20)}`;
  const previousEventHash = input.previous_event_hash || options.previous_event_hash || options.previousReceipt?.event_hash || null;
  const blockedReason = validation.blockedReasons.join('; ') || input.blocked_reason || null;

  const receipt = {
    event_id: eventId,
    event_type: validation.allowed ? input.event_type : 'systems.policy.blocked',
    requested_event_type: input.event_type || null,
    from_address: input.from_address || null,
    to_address: input.to_address || null,
    actor_type: input.actor_type || null,
    actor_id: input.actor_id || null,
    business_identity_number: input.business_identity_number || null,
    business_address: input.business_address || null,
    business_id: input.business_id || null,
    customer_id: input.customer_id || null,
    workspace_id: input.workspace_id || null,
    project_id: input.project_id || null,
    system_id: input.system_id || input.module_id || null,
    module_id: input.module_id || input.system_id || null,
    order_id: input.order_id || null,
    job_id: input.job_id || null,
    accounting_id: input.accounting_id || null,
    vendor_id: input.vendor_id || null,
    shipment_id: input.shipment_id || null,
    payload_hash: validation.payloadHash || null,
    payload_redaction_class: input.payload_redaction_class || null,
    evidence_refs: input.evidence_refs || [],
    source_refs: input.source_refs || [],
    approval_refs: input.approval_refs || [],
    vault_lineage_refs: input.vault_lineage_refs || [],
    policy_result: validation.policy_result,
    policy_checks: validation.policyChecks,
    previous_event_hash: previousEventHash,
    blocked_reason: blockedReason,
    auth_status: input.auth_status || null,
    signature_status: input.signature_status || input.auth_status || 'local_unsigned',
    timestamp: now,
    receipt_id: input.receipt_id || `rcpt_${sha256Hex(`${eventId}:${validation.payloadHash}:${previousEventHash || ''}`).slice(0, 24)}`,
    security_class: input.security_class || null,
    retention_class: input.retention_class || null
  };

  const receiptHash = createEventHash(receipt);

  return {
    ...receipt,
    event_hash: receiptHash,
    receipt_hash: receiptHash,
    trust_layer: TRUSTNET_LAYER,
    guard_layer: NEROA_GUARD_PRODUCT_LAYER,
    network_behavior: 'address_to_address_proof_audit_only'
  };
}

export class LocalTrustNetReceiptStore {
  constructor({ seedReceipts = [] } = {}) {
    this.receipts = [...seedReceipts];
  }

  latest() {
    return this.receipts[this.receipts.length - 1] || null;
  }

  append(input) {
    const receipt = createTrustNetReceipt(input, { previousReceipt: this.latest() });
    this.receipts.push(receipt);
    return receipt;
  }

  all() {
    return [...this.receipts];
  }

  findByReceiptId(receiptId) {
    return this.receipts.find((receipt) => receipt.receipt_id === receiptId) || null;
  }

  verifyChain() {
    return this.receipts.every((receipt, index) => {
      const { event_hash: eventHash, receipt_hash: _receiptHash, ...withoutHash } = receipt;
      const recalculated = createEventHash(withoutHash);
      if (eventHash !== recalculated) return false;
      if (index === 0) return !receipt.previous_event_hash;
      return receipt.previous_event_hash === this.receipts[index - 1].event_hash;
    });
  }
}

export function createLocalTrustNetAdapter({ store = new LocalTrustNetReceiptStore() } = {}) {
  return {
    store,
    emitProofEvent(input) {
      return store.append(input);
    },
    emitPolicyBlocked(input, blocked_reason = 'blocked by Neroa Guard policy') {
      return store.append({
        ...input,
        event_type: 'systems.policy.blocked',
        blocked_reason,
        payload_redaction_class: input.payload_redaction_class || 'metadata_only',
        security_class: input.security_class || 'bank_level',
        retention_class: input.retention_class || 'audit_7y'
      });
    },
    emitApprovalRequired(input) {
      if (!input.approval_refs?.length) {
        return store.append({
          ...input,
          event_type: 'systems.policy.blocked',
          blocked_reason: 'approval-required action has no approval_ref',
          payload_redaction_class: input.payload_redaction_class || 'metadata_only',
          security_class: input.security_class || 'bank_level',
          retention_class: input.retention_class || 'audit_7y'
        });
      }
      return store.append({ ...input, event_type: 'systems.action.approved' });
    }
  };
}
