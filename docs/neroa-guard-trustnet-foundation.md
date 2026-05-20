# Neroa Guard / TrustNet foundation

This platform is Neroa Systems: the business systems, assistant, and operations platform. ERP is a functional category only and is not the product name for this foundation.

## Canonical naming

- Neroa Guard is the guarded proof, trust, and audit product layer.
- TrustNet is the DAG-based trust network inside Neroa Guard.
- TrustNet records address-to-address proof and audit transactions. These are not coins.
- Neroa Systems executes the business and assistant lane.
- Neroa One Brain controls decisions.
- Neroa Guard / TrustNet is the central proof network.
- Neroa Scan will later search and verify receipts.
- Neroa Vault will later attach memory and source lineage.

This foundation intentionally does not add public crypto behavior. It does not add wallet, token, custody, bridge, public-chain, gas, or mainnet behavior.

## Address model

Addresses are local proof endpoints in the form:

```text
trustnet:<system>:<workspace_id>:<business_id>:<module_id>:<actor_type>:<actor_id>
```

They are used to route proof receipts from one business/system/actor endpoint to another. They are not wallets.

## Receipt model

Each important action should eventually emit a Neroa Guard TrustNet receipt with the following fields:

- event_id
- event_type
- from_address
- to_address
- actor_type
- actor_id
- business_id
- customer_id
- workspace_id
- project_id
- system_id
- module_id
- order_id
- job_id
- accounting_id
- vendor_id
- shipment_id
- payload_hash
- payload_redaction_class
- evidence_refs
- source_refs
- approval_refs
- policy_result
- policy_checks
- previous_event_hash
- blocked_reason
- auth_status
- signature_status
- timestamp
- receipt_id
- security_class
- retention_class
- event_hash

Receipts are hash-linked through `previous_event_hash` and `event_hash` to create a local DAG/hash-linked proof chain.

## Redaction classes

- hash_only
- metadata_only
- redacted_summary
- private_internal
- customer_safe_projection
- raw_sensitive_internal

## Event families

- systems.action.requested
- systems.action.approved
- systems.action.blocked
- systems.worker.started
- systems.worker.completed
- systems.worker.failed
- systems.customer.created
- systems.vendor.created
- systems.order.created
- systems.order.updated
- systems.production.updated
- systems.purchase_order.created
- systems.shipment.created
- systems.invoice.created
- systems.payment.recorded
- systems.accounting.reconciliation_started
- systems.accounting.reconciliation_completed
- systems.audit_report.created
- systems.sop.created
- systems.sop.updated
- systems.assistant.action_started
- systems.assistant.action_completed
- systems.assistant.action_blocked
- systems.policy.blocked

## Bank-level fail-closed policy

The local adapter blocks unsafe actions and emits `systems.policy.blocked` receipts when a request violates policy. It fails closed when:

- event type is unknown
- from_address is missing
- to_address is missing
- actor identity is missing
- required business/customer/workspace context is missing for customer-impacting events
- payload_hash cannot be created
- approval-required action has no approval_ref
- prohibited public crypto behavior is attempted
- sensitive data is exposed into customer-safe receipts
- cross-user or cross-customer data access is attempted
- uncontrolled model-to-model chatter is attempted
- uncontrolled production execution is attempted
- accounting/payment/shipping/customer-impacting changes have no required approval or policy path

## Local-only adapter

The current implementation is local/dev only:

- `src/neroaGuard/trustNetGuard.js`
- `LocalTrustNetReceiptStore`
- `createLocalTrustNetAdapter`
- `createTrustNetReceipt`
- `validateTrustNetRequest`

This is not a separate blockchain. It is the local foundation for the Neroa Guard / TrustNet proof standard.

## Validation

Run:

```bash
npm run validate:trustnet
```

The validation covers allowed receipts, blocked unknown event types, blocked missing identity/address, approval-required blocking, sensitive customer-safe blocking, cross-customer blocking, uncontrolled production blocking, approval-required paths, and local hash-chain verification.
