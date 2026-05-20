import assert from 'node:assert/strict';
import {
  TRUSTNET_EVENT_FAMILIES,
  TRUSTNET_REDACTION_CLASSES,
  LocalTrustNetReceiptStore,
  createLocalTrustNetAdapter,
  createTrustNetReceipt,
  trustAddress,
  validateTrustNetRequest
} from '../src/neroaGuard/trustNetGuard.js';
import {
  TRUSTNET_PACKAGE_TYPES,
  buildTrustNetPackageReceipts,
  createPackageInstallPlan,
  createPackageInstallPlans
} from '../src/neroaGuard/trustNetPackageWiring.js';
import {
  SYSTEMS_VAULT_LINEAGE_EVENTS,
  LocalVaultLineageStore,
  createLocalVaultLineageAdapter,
  createVaultLineageRecord,
  validateVaultLineageRecord
} from '../src/neroaGuard/neroaVaultLineage.js';

function baseEvent(overrides = {}) {
  return {
    event_type: 'systems.customer.created',
    from_address: trustAddress({ workspace_id: 'workspace-a', business_id: 'biz-a', business_identity_number: 'BIN-001', actor_type: 'user', actor_id: 'admin-1', module_id: 'contacts' }),
    to_address: trustAddress({ workspace_id: 'workspace-a', business_id: 'biz-a', business_identity_number: 'BIN-001', module_id: 'contacts' }),
    actor_type: 'user',
    actor_id: 'admin-1',
    business_identity_number: 'BIN-001',
    business_address: 'trustnet:business:bin-001',
    business_id: 'biz-a',
    customer_id: 'cust-a',
    workspace_id: 'workspace-a',
    module_id: 'contacts',
    payload: { company_name: 'Atlas Apparel', summary: 'customer record created' },
    payload_redaction_class: 'metadata_only',
    evidence_refs: ['evidence:local:contact-form'],
    source_refs: ['source:local:ui'],
    approval_refs: [],
    auth_status: 'local_authenticated',
    security_class: 'bank_level',
    retention_class: 'audit_7y',
    ...overrides
  };
}

assert.ok(TRUSTNET_EVENT_FAMILIES.includes('systems.policy.blocked'));
assert.ok(TRUSTNET_EVENT_FAMILIES.includes('systems.fulfillment.completed'));
assert.ok(TRUSTNET_EVENT_FAMILIES.includes('systems.communication.sent'));
assert.deepEqual(TRUSTNET_REDACTION_CLASSES, [
  'hash_only',
  'metadata_only',
  'redacted_summary',
  'private_internal',
  'customer_safe_projection',
  'raw_sensitive_internal'
]);

const allowed = createTrustNetReceipt(baseEvent());
assert.equal(allowed.event_type, 'systems.customer.created');
assert.equal(allowed.policy_result, 'allowed');
assert.equal(allowed.network_behavior, 'address_to_address_proof_audit_only');
assert.ok(allowed.payload_hash);
assert.ok(allowed.receipt_id);
assert.ok(allowed.event_hash);
assert.ok(allowed.receipt_hash);
assert.equal(allowed.business_identity_number, 'BIN-001');
assert.equal(allowed.business_address, 'trustnet:business:bin-001');

const unknownEvent = createTrustNetReceipt(baseEvent({ event_type: 'systems.wallet.created' }));
assert.equal(unknownEvent.event_type, 'systems.policy.blocked');
assert.equal(unknownEvent.policy_result, 'blocked');
assert.match(unknownEvent.blocked_reason, /event_type is unknown/);

const missingActor = validateTrustNetRequest(baseEvent({ actor_id: '' }));
assert.equal(missingActor.allowed, false);
assert.match(missingActor.blockedReasons.join(';'), /actor identity is missing/);

const missingAddress = createTrustNetReceipt(baseEvent({ from_address: null }));
assert.equal(missingAddress.event_type, 'systems.policy.blocked');
assert.match(missingAddress.blocked_reason, /from_address is missing/);

const missingBusinessIdentity = createTrustNetReceipt(baseEvent({ business_identity_number: '' }));
assert.equal(missingBusinessIdentity.event_type, 'systems.policy.blocked');
assert.match(missingBusinessIdentity.blocked_reason, /business_identity_number or business_address is missing/);

const sourceBackedBlocked = createTrustNetReceipt(baseEvent({
  event_type: 'systems.business_decision.recommended',
  source_refs: [],
  evidence_refs: [],
  payload: { summary: 'AI business decision without source' }
}));
assert.equal(sourceBackedBlocked.event_type, 'systems.policy.blocked');
assert.match(sourceBackedBlocked.blocked_reason, /source-backed action has no source_ref/);

const approvalBlocked = createTrustNetReceipt(baseEvent({
  event_type: 'systems.payment.recorded',
  accounting_id: 'acct-1',
  payload: { amount: 1250, summary: 'payment recorded' }
}));
assert.equal(approvalBlocked.event_type, 'systems.policy.blocked');
assert.match(approvalBlocked.blocked_reason, /approval-required action has no approval_ref/);

const approvalAllowed = createTrustNetReceipt(baseEvent({
  event_type: 'systems.payment.recorded',
  accounting_id: 'acct-1',
  approval_refs: ['approval:owner:payment-1'],
  payload: { amount_bucket: '1000-1500', summary: 'payment recorded' }
}));
assert.equal(approvalAllowed.event_type, 'systems.payment.recorded');
assert.equal(approvalAllowed.policy_result, 'allowed');

const publicBehaviorBlocked = createTrustNetReceipt(baseEvent({
  payload: { request: 'create wallet and token bridge' }
}));
assert.equal(publicBehaviorBlocked.event_type, 'systems.policy.blocked');
assert.match(publicBehaviorBlocked.blocked_reason, /prohibited public crypto behavior/);

const sensitiveCustomerSafeBlocked = createTrustNetReceipt(baseEvent({
  payload_redaction_class: 'customer_safe_projection',
  payload: { summary: 'bank account 1234 payroll detail' }
}));
assert.equal(sensitiveCustomerSafeBlocked.event_type, 'systems.policy.blocked');
assert.match(sensitiveCustomerSafeBlocked.blocked_reason, /customer-safe receipt attempted to expose sensitive data/);

const crossCustomerBlocked = createTrustNetReceipt(baseEvent({ cross_customer_access: true }));
assert.equal(crossCustomerBlocked.event_type, 'systems.policy.blocked');
assert.match(crossCustomerBlocked.blocked_reason, /cross-user, cross-customer, or cross-workspace/);

const uncontrolledProductionBlocked = createTrustNetReceipt(baseEvent({ uncontrolled_production_execution: true }));
assert.equal(uncontrolledProductionBlocked.event_type, 'systems.policy.blocked');
assert.match(uncontrolledProductionBlocked.blocked_reason, /uncontrolled production execution/);

const store = new LocalTrustNetReceiptStore();
const adapter = createLocalTrustNetAdapter({ store });
const first = adapter.emitProofEvent(baseEvent({ event_id: 'evt-one' }));
const second = adapter.emitProofEvent(baseEvent({ event_id: 'evt-two', customer_id: 'cust-b', payload: { company_name: 'River City Merch' } }));
assert.equal(second.previous_event_hash, first.event_hash);
assert.equal(store.verifyChain(), true);

const approvalRequiredReceipt = adapter.emitApprovalRequired(baseEvent({
  event_type: 'systems.invoice.created',
  approval_refs: [],
  payload: { invoice_id: 'inv-1' }
}));
assert.equal(approvalRequiredReceipt.event_type, 'systems.policy.blocked');
assert.match(approvalRequiredReceipt.blocked_reason, /approval-required/);

assert.ok(TRUSTNET_PACKAGE_TYPES.shipping);
assert.ok(TRUSTNET_PACKAGE_TYPES.fulfillment);
assert.ok(TRUSTNET_PACKAGE_TYPES.logistics);
assert.ok(TRUSTNET_PACKAGE_TYPES.projects);

const shippingReceipts = buildTrustNetPackageReceipts({
  packageType: 'shipping',
  action: 'create shipment',
  actor_type: 'user',
  actor_id: 'shipper-1',
  business_identity_number: 'BIN-001',
  business_address: 'trustnet:business:bin-001',
  business_id: 'biz-a',
  customer_id: 'cust-a',
  workspace_id: 'workspace-a',
  shipment_id: 'ship-1',
  approval_refs: ['approval:shipping:ship-1'],
  payload: { summary: 'shipment created from fulfillment' },
  store: new LocalTrustNetReceiptStore()
});
assert.equal(shippingReceipts.length, 1);
assert.equal(shippingReceipts[0].event_type, 'systems.shipment.created');
assert.equal(shippingReceipts[0].policy_result, 'allowed');
assert.equal(shippingReceipts[0].module_id, 'shipping');
assert.deepEqual(shippingReceipts[0].payload_hash.length, 64);

const fulfillmentBlocked = buildTrustNetPackageReceipts({
  packageType: 'fulfillment',
  action: 'production update',
  actor_type: 'worker',
  actor_id: 'press-operator-1',
  business_identity_number: 'BIN-001',
  business_address: 'trustnet:business:bin-001',
  business_id: 'biz-a',
  customer_id: 'cust-a',
  workspace_id: 'workspace-a',
  order_id: 'order-1',
  payload: { summary: 'production quantity update' },
  store: new LocalTrustNetReceiptStore()
});
assert.equal(fulfillmentBlocked[0].event_type, 'systems.policy.blocked');
assert.match(fulfillmentBlocked[0].blocked_reason, /approval-required/);

const projectPlans = createPackageInstallPlans(['projects', 'logistics', 'purchasing']);
assert.equal(projectPlans.length, 3);
assert.deepEqual(createPackageInstallPlan('projects').downstream_modules, ['accounting', 'customer', 'fulfillment', 'shipping']);

assert.ok(SYSTEMS_VAULT_LINEAGE_EVENTS.includes('systems.shipment.linked_to_vault'));
const lineage = createVaultLineageRecord({
  repo: 'NeroaEngine/steelcraft',
  system_name: 'Neroa Systems',
  module_name: 'contacts',
  action_id: 'action-contact-created-1',
  event_id: allowed.event_id,
  receipt_id: allowed.receipt_id,
  memory_refs: ['memory:local:contact-summary'],
  source_refs: allowed.source_refs,
  decision_refs: ['decision:local:route-contact-to-accounting'],
  approval_refs: allowed.approval_refs,
  evidence_refs: allowed.evidence_refs,
  customer_refs: ['cust-a'],
  business_refs: ['BIN-001'],
  redaction_class: 'metadata_only',
  retention_class: 'audit_7y',
  created_by_actor: 'admin-1',
  summary: 'Contact creation linked to TrustNet receipt.'
});
assert.equal(lineage.policy_result, 'allowed');
assert.equal(lineage.receipt_id, allowed.receipt_id);
assert.ok(lineage.lineage_hash);

const lineageMissingSource = validateVaultLineageRecord({
  repo: 'NeroaEngine/steelcraft',
  system_name: 'Neroa Systems',
  action_id: 'source-required-action',
  created_by_actor: 'admin-1',
  redaction_class: 'metadata_only',
  retention_class: 'audit_7y',
  source_required: true,
  source_refs: []
});
assert.equal(lineageMissingSource.allowed, false);
assert.match(lineageMissingSource.blockedReasons.join(';'), /source-backed lineage has no source_refs/);

const lineageSensitiveBlocked = createVaultLineageRecord({
  repo: 'NeroaEngine/steelcraft',
  system_name: 'Neroa Systems',
  action_id: 'unsafe-customer-safe-lineage',
  created_by_actor: 'admin-1',
  redaction_class: 'customer_safe_projection',
  retention_class: 'audit_7y',
  summary: 'bank account and payroll detail should not be exposed'
});
assert.equal(lineageSensitiveBlocked.policy_result, 'blocked');
assert.match(lineageSensitiveBlocked.blocked_reason, /customer-safe lineage attempted to expose sensitive data/);

const lineageStore = new LocalVaultLineageStore();
const lineageAdapter = createLocalVaultLineageAdapter({ store: lineageStore });
const linked = lineageAdapter.linkReceipt({
  receipt: allowed,
  repo: 'NeroaEngine/steelcraft',
  system_name: 'Neroa Systems',
  module_name: 'contacts',
  action_id: 'link-receipt-action',
  created_by_actor: 'admin-1',
  summary: 'Receipt linked to local Vault lineage.'
});
assert.equal(linked.receipt_id, allowed.receipt_id);
assert.equal(lineageStore.findByReceiptId(allowed.receipt_id).length, 1);

console.log('Neroa Guard TrustNet and Neroa Vault local validation passed.');
