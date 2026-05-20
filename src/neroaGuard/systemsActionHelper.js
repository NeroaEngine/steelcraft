import {
  LocalTrustNetReceiptStore,
  createLocalTrustNetAdapter,
  createPayloadHash,
  trustAddress
} from './trustNetGuard.js';
import {
  LocalVaultLineageStore,
  createLocalVaultLineageAdapter
} from './neroaVaultLineage.js';

export const SYSTEMS_ACTION_HELPER_EVENT_TYPES = Object.freeze([
  'systems.contact.created',
  'systems.customer.created',
  'systems.vendor.created',
  'systems.invoice.created',
  'systems.payment.recorded',
  'systems.accounting.reconciliation_started',
  'systems.accounting.reconciliation_completed',
  'systems.assistant.action_started',
  'systems.assistant.action_completed',
  'systems.assistant.action_blocked',
  'systems.fulfillment.started',
  'systems.fulfillment.completed',
  'systems.shipment.created',
  'systems.logistics.started',
  'systems.logistics.completed',
  'systems.communication.drafted',
  'systems.communication.sent',
  'systems.communication.blocked'
]);

const BUSINESS_SCOPED_ACTIONS = new Set(SYSTEMS_ACTION_HELPER_EVENT_TYPES);
const LINEAGE_EVENT_BY_ACTION_PREFIX = [
  ['systems.contact.', 'systems.contact.linked_to_vault'],
  ['systems.customer.', 'systems.customer.linked_to_vault'],
  ['systems.vendor.', 'systems.vendor.linked_to_vault'],
  ['systems.invoice.', 'systems.invoice.linked_to_vault'],
  ['systems.payment.', 'systems.payment.linked_to_vault'],
  ['systems.accounting.', 'systems.accounting.linked_to_vault'],
  ['systems.assistant.', 'systems.assistant_action.linked_to_vault'],
  ['systems.fulfillment.', 'systems.fulfillment.linked_to_vault'],
  ['systems.shipment.', 'systems.shipment.linked_to_vault'],
  ['systems.logistics.', 'systems.logistics.linked_to_vault'],
  ['systems.communication.', 'systems.communication.linked_to_vault']
];

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function lineageEventFor(eventType) {
  const match = LINEAGE_EVENT_BY_ACTION_PREFIX.find(([prefix]) => eventType.startsWith(prefix));
  return match?.[1] || 'systems.action.linked_to_vault';
}

function makeBlockedResult({ reason, receipt = null, lineage = null }) {
  return {
    ok: false,
    policy_result: 'blocked',
    blocked_reason: reason,
    receipt,
    lineage,
    receipt_id: receipt?.receipt_id || null,
    lineage_id: lineage?.lineage_id || null
  };
}

export function createSystemsActionAddress({
  business_identity_number,
  business_id,
  workspace_id,
  module_id,
  actor_type,
  actor_id
} = {}) {
  return trustAddress({
    system: 'neroa-systems',
    workspace_id,
    business_identity_number,
    business_id,
    module_id,
    actor_type,
    actor_id
  });
}

export function emitSystemsActionWithReceiptAndLineage({
  event_type,
  action_id,
  actor_type,
  actor_id,
  business_identity_number,
  business_address,
  business_id,
  workspace_id,
  customer_id,
  project_id,
  module_id,
  order_id,
  job_id,
  accounting_id,
  vendor_id,
  shipment_id,
  from_address,
  to_address,
  payload = {},
  payload_hash,
  payload_redaction_class = 'metadata_only',
  evidence_refs = [],
  source_refs = [],
  approval_refs = [],
  vault_lineage_refs = [],
  auth_status = 'local_authenticated',
  signature_status,
  security_class = 'bank_level',
  retention_class = 'audit_7y',
  memory_refs = [],
  decision_refs = [],
  prompt_refs = [],
  project_refs = [],
  customer_refs = [],
  business_refs = [],
  thread_refs = [],
  message_refs = [],
  order_refs = [],
  job_refs = [],
  vendor_refs = [],
  shipment_refs = [],
  invoice_refs = [],
  payment_refs = [],
  accounting_refs = [],
  repo = 'NeroaEngine/steelcraft',
  system_name = 'Neroa Systems',
  summary,
  notes,
  customer_safe = false,
  source_backed_action = false,
  cross_user_access = false,
  cross_customer_access = false,
  cross_workspace_access = false,
  uncontrolled_model_chatter = false,
  uncontrolled_production_execution = false,
  bypass_neroa_policy = false,
  policy_override,
  trustStore = new LocalTrustNetReceiptStore(),
  vaultStore = new LocalVaultLineageStore(),
  guardAdapter,
  vaultAdapter
} = {}) {
  if (!SYSTEMS_ACTION_HELPER_EVENT_TYPES.includes(event_type)) {
    return makeBlockedResult({ reason: `unsupported Systems action event_type: ${event_type}` });
  }

  if (BUSINESS_SCOPED_ACTIONS.has(event_type) && isMissing(business_identity_number)) {
    return makeBlockedResult({ reason: 'business_identity_number is missing for business-scoped Systems action' });
  }

  if (BUSINESS_SCOPED_ACTIONS.has(event_type) && isMissing(business_address)) {
    return makeBlockedResult({ reason: 'business_address is missing for business-scoped Systems action' });
  }

  if (isMissing(actor_id)) {
    return makeBlockedResult({ reason: 'actor_id is missing' });
  }

  const resolvedFromAddress = from_address || createSystemsActionAddress({ business_identity_number, business_id, workspace_id, module_id, actor_type, actor_id });
  const resolvedToAddress = to_address || createSystemsActionAddress({ business_identity_number, business_id, workspace_id, module_id });

  if (isMissing(resolvedFromAddress)) {
    return makeBlockedResult({ reason: 'from_address is missing' });
  }

  if (isMissing(resolvedToAddress)) {
    return makeBlockedResult({ reason: 'to_address is missing' });
  }

  let resolvedPayloadHash = payload_hash;
  try {
    resolvedPayloadHash ||= createPayloadHash(payload);
  } catch (error) {
    return makeBlockedResult({ reason: `payload_hash cannot be created: ${error.message}` });
  }

  const actionId = action_id || `${event_type}:${actor_id}:${Date.now()}`;
  const trustAdapter = guardAdapter || createLocalTrustNetAdapter({ store: trustStore });
  const lineageAdapter = vaultAdapter || createLocalVaultLineageAdapter({ store: vaultStore });

  let receipt;
  try {
    receipt = trustAdapter.emitProofEvent({
      event_type,
      from_address: resolvedFromAddress,
      to_address: resolvedToAddress,
      actor_type,
      actor_id,
      business_identity_number,
      business_address,
      business_id,
      customer_id,
      workspace_id,
      project_id,
      system_id: 'neroa-systems',
      module_id,
      order_id,
      job_id,
      accounting_id,
      vendor_id,
      shipment_id,
      payload,
      payload_hash: resolvedPayloadHash,
      payload_redaction_class,
      evidence_refs,
      source_refs,
      approval_refs,
      vault_lineage_refs,
      auth_status,
      signature_status,
      security_class,
      retention_class,
      customer_safe,
      source_backed_action,
      cross_user_access,
      cross_customer_access,
      cross_workspace_access,
      uncontrolled_model_chatter,
      uncontrolled_production_execution,
      bypass_neroa_policy,
      policy_override
    });
  } catch (error) {
    return makeBlockedResult({ reason: `receipt emission failed: ${error.message}` });
  }

  if (!receipt || receipt.policy_result !== 'allowed') {
    return makeBlockedResult({ reason: receipt?.blocked_reason || 'receipt emission failed closed', receipt });
  }

  let lineage;
  try {
    lineage = lineageAdapter.linkReceipt({
      receipt,
      repo,
      system_name,
      module_name: module_id,
      action_id: actionId,
      memory_refs,
      source_refs,
      decision_refs,
      approval_refs,
      evidence_refs,
      prompt_refs,
      project_refs: project_refs.length ? project_refs : [project_id].filter(Boolean),
      customer_refs: customer_refs.length ? customer_refs : [customer_id].filter(Boolean),
      business_refs: business_refs.length ? business_refs : [business_identity_number || business_id].filter(Boolean),
      thread_refs,
      message_refs,
      order_refs: order_refs.length ? order_refs : [order_id].filter(Boolean),
      job_refs: job_refs.length ? job_refs : [job_id].filter(Boolean),
      vendor_refs: vendor_refs.length ? vendor_refs : [vendor_id].filter(Boolean),
      shipment_refs: shipment_refs.length ? shipment_refs : [shipment_id].filter(Boolean),
      invoice_refs,
      payment_refs,
      accounting_refs: accounting_refs.length ? accounting_refs : [accounting_id].filter(Boolean),
      redaction_class: payload_redaction_class,
      retention_class,
      created_by_actor: actor_id,
      summary: summary || `${event_type} linked to TrustNet receipt`,
      notes,
      source_required: source_backed_action,
      cross_user_access,
      cross_customer_access,
      cross_workspace_access,
      payload
    });
  } catch (error) {
    return makeBlockedResult({ reason: `lineage record creation failed: ${error.message}`, receipt });
  }

  if (!lineage || lineage.policy_result !== 'allowed') {
    return makeBlockedResult({ reason: lineage?.blocked_reason || 'lineage record creation failed closed', receipt, lineage });
  }

  return {
    ok: true,
    policy_result: 'allowed',
    receipt,
    lineage,
    receipt_id: receipt.receipt_id,
    lineage_id: lineage.lineage_id,
    event_id: receipt.event_id,
    lineage_event_type: lineageEventFor(event_type),
    trustStore,
    vaultStore
  };
}
