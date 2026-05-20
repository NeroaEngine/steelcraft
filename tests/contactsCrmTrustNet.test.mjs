import assert from 'node:assert/strict';
import {
  emitContactCreatedWithReceiptAndLineage,
  emitCustomerCreatedWithReceiptAndLineage,
  emitVendorCreatedWithReceiptAndLineage,
  emitContactsCrmCreateWithReceiptAndLineage
} from '../src/neroaGuard/contactsCrmTrustNet.js';

function baseContact(overrides = {}) {
  return {
    actor_type: 'user',
    actor_id: 'admin-1',
    business_identity_number: 'BIN-001',
    business_address: 'trustnet:business:bin-001',
    business_id: 'biz-a',
    workspace_id: 'workspace-a',
    contact_id: 'contact-1',
    name: 'Jamie Contact',
    email: 'jamie@example.com',
    company_name: 'Atlas Apparel',
    payload_redaction_class: 'metadata_only',
    source_refs: ['source:contacts-crm:create-form'],
    evidence_refs: ['evidence:contacts-crm:create-submit'],
    ...overrides
  };
}

const contactCreated = emitContactCreatedWithReceiptAndLineage(baseContact());
assert.equal(contactCreated.ok, true);
assert.equal(contactCreated.receipt.event_type, 'systems.contact.created');
assert.equal(contactCreated.receipt.module_id, 'contacts');
assert.equal(contactCreated.lineage.receipt_id, contactCreated.receipt.receipt_id);
assert.equal(contactCreated.lineage.module_name, 'contacts');
assert.equal(contactCreated.vaultStore.findByReceiptId(contactCreated.receipt_id).length, 1);
assert.equal(contactCreated.trustStore.findByReceiptId(contactCreated.receipt_id).receipt_id, contactCreated.receipt_id);

const customerCreated = emitCustomerCreatedWithReceiptAndLineage(baseContact({
  contact_id: null,
  customer_id: 'cust-1',
  name: 'Atlas Buyer',
  company_name: 'Atlas Apparel'
}));
assert.equal(customerCreated.ok, true);
assert.equal(customerCreated.receipt.event_type, 'systems.customer.created');
assert.equal(customerCreated.receipt.customer_id, 'cust-1');
assert.equal(customerCreated.lineage.receipt_id, customerCreated.receipt.receipt_id);
assert.deepEqual(customerCreated.lineage.customer_refs, ['cust-1']);

const vendorCreated = emitVendorCreatedWithReceiptAndLineage(baseContact({
  contact_id: null,
  vendor_id: 'vendor-1',
  name: 'Blank Shirt Supply AP',
  company_name: 'Blank Shirt Supply'
}));
assert.equal(vendorCreated.ok, true);
assert.equal(vendorCreated.receipt.event_type, 'systems.vendor.created');
assert.equal(vendorCreated.receipt.vendor_id, 'vendor-1');
assert.equal(vendorCreated.lineage.receipt_id, vendorCreated.receipt.receipt_id);
assert.deepEqual(vendorCreated.lineage.vendor_refs, ['vendor-1']);

const dispatcherCustomer = emitContactsCrmCreateWithReceiptAndLineage(baseContact({
  record_type: 'customer',
  customer_id: 'cust-2'
}));
assert.equal(dispatcherCustomer.ok, true);
assert.equal(dispatcherCustomer.receipt.event_type, 'systems.customer.created');

const missingBusinessIdentity = emitContactCreatedWithReceiptAndLineage(baseContact({
  business_identity_number: ''
}));
assert.equal(missingBusinessIdentity.ok, false);
assert.match(missingBusinessIdentity.blocked_reason, /business_identity_number is missing/);
assert.equal(missingBusinessIdentity.receipt_id, null);
assert.equal(missingBusinessIdentity.lineage_id, null);

const missingBusinessAddress = emitCustomerCreatedWithReceiptAndLineage(baseContact({
  business_address: ''
}));
assert.equal(missingBusinessAddress.ok, false);
assert.match(missingBusinessAddress.blocked_reason, /business_address is missing/);
assert.equal(missingBusinessAddress.receipt_id, null);
assert.equal(missingBusinessAddress.lineage_id, null);

const missingSourceRefs = emitVendorCreatedWithReceiptAndLineage(baseContact({
  vendor_id: 'vendor-2',
  source_refs: []
}));
assert.equal(missingSourceRefs.ok, false);
assert.match(missingSourceRefs.blocked_reason, /source_refs are required/);
assert.equal(missingSourceRefs.receipt_id, null);
assert.equal(missingSourceRefs.lineage_id, null);

const sensitiveCustomerSafe = emitCustomerCreatedWithReceiptAndLineage(baseContact({
  customer_id: 'cust-sensitive',
  payload_redaction_class: 'customer_safe_projection',
  customer_safe: true,
  payload: { summary: 'bank account and payroll detail must not be customer safe' }
}));
assert.equal(sensitiveCustomerSafe.ok, false);
assert.match(sensitiveCustomerSafe.blocked_reason, /customer-safe receipt attempted to expose sensitive data/);

const forbiddenPublicBehavior = emitContactCreatedWithReceiptAndLineage(baseContact({
  payload: { summary: 'create wallet token gas mainnet custody bridge behavior' }
}));
assert.equal(forbiddenPublicBehavior.ok, false);
assert.match(forbiddenPublicBehavior.blocked_reason, /prohibited public crypto behavior/);

console.log('Contacts / CRM TrustNet wiring validation passed.');
