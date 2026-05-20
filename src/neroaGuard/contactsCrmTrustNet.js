import { LocalTrustNetReceiptStore } from './trustNetGuard.js';
import { LocalVaultLineageStore } from './neroaVaultLineage.js';
import { emitSystemsActionWithReceiptAndLineage } from './systemsActionHelper.js';

export const CONTACTS_CRM_CREATE_EVENT_TYPES = Object.freeze([
  'systems.contact.created',
  'systems.customer.created',
  'systems.vendor.created'
]);

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function makeCreateActionId(eventType, actorId, subjectId) {
  const safeSubject = subjectId || 'new-record';
  return `${eventType}:${actorId || 'unknown-actor'}:${safeSubject}`;
}

function buildContactsPayload({ record_type, name, email, company_name, notes, payload = {} } = {}) {
  return {
    record_type,
    name: name || null,
    email: email || null,
    company_name: company_name || null,
    summary: payload.summary || `${record_type || 'contact'} record created through Contacts / CRM`,
    ...payload
  };
}

function emitContactsCrmCreateAction({
  event_type,
  record_type,
  actor_type = 'user',
  actor_id,
  business_identity_number,
  business_address,
  business_id,
  workspace_id,
  customer_id,
  vendor_id,
  contact_id,
  project_id,
  from_address,
  to_address,
  name,
  email,
  company_name,
  notes,
  payload = {},
  payload_redaction_class = 'metadata_only',
  evidence_refs = [],
  source_refs = ['source:contacts-crm:create-form'],
  approval_refs = [],
  memory_refs = [],
  decision_refs = [],
  trustStore = new LocalTrustNetReceiptStore(),
  vaultStore = new LocalVaultLineageStore(),
  guardAdapter,
  vaultAdapter,
  customer_safe = false
} = {}) {
  if (!CONTACTS_CRM_CREATE_EVENT_TYPES.includes(event_type)) {
    return {
      ok: false,
      policy_result: 'blocked',
      blocked_reason: `unsupported Contacts / CRM create event_type: ${event_type}`,
      receipt: null,
      lineage: null,
      receipt_id: null,
      lineage_id: null
    };
  }

  if (isMissing(source_refs)) {
    return {
      ok: false,
      policy_result: 'blocked',
      blocked_reason: 'source_refs are required for Contacts / CRM create actions',
      receipt: null,
      lineage: null,
      receipt_id: null,
      lineage_id: null
    };
  }

  const subjectId = contact_id || customer_id || vendor_id || name || company_name;
  return emitSystemsActionWithReceiptAndLineage({
    event_type,
    action_id: makeCreateActionId(event_type, actor_id, subjectId),
    actor_type,
    actor_id,
    business_identity_number,
    business_address,
    business_id,
    workspace_id,
    customer_id,
    vendor_id,
    project_id,
    module_id: 'contacts',
    from_address,
    to_address,
    payload: buildContactsPayload({ record_type, name, email, company_name, notes, payload }),
    payload_redaction_class,
    evidence_refs,
    source_refs,
    approval_refs,
    memory_refs,
    decision_refs,
    customer_refs: [customer_id].filter(Boolean),
    vendor_refs: [vendor_id].filter(Boolean),
    business_refs: [business_identity_number || business_id].filter(Boolean),
    repo: 'NeroaEngine/steelcraft',
    system_name: 'Neroa Systems',
    summary: `${record_type} create action linked to TrustNet receipt and Vault lineage`,
    notes,
    source_backed_action: true,
    customer_safe,
    trustStore,
    vaultStore,
    guardAdapter,
    vaultAdapter
  });
}

export function emitContactCreatedWithReceiptAndLineage(context = {}) {
  return emitContactsCrmCreateAction({
    ...context,
    event_type: 'systems.contact.created',
    record_type: 'contact'
  });
}

export function emitCustomerCreatedWithReceiptAndLineage(context = {}) {
  return emitContactsCrmCreateAction({
    ...context,
    event_type: 'systems.customer.created',
    record_type: 'customer'
  });
}

export function emitVendorCreatedWithReceiptAndLineage(context = {}) {
  return emitContactsCrmCreateAction({
    ...context,
    event_type: 'systems.vendor.created',
    record_type: 'vendor'
  });
}

export function emitContactsCrmCreateWithReceiptAndLineage(context = {}) {
  const normalizedType = context.record_type || context.type || 'contact';
  if (normalizedType === 'customer') return emitCustomerCreatedWithReceiptAndLineage(context);
  if (normalizedType === 'vendor') return emitVendorCreatedWithReceiptAndLineage(context);
  return emitContactCreatedWithReceiptAndLineage(context);
}
