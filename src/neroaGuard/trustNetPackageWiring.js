import { createLocalTrustNetAdapter, trustAddress } from './trustNetGuard.js';

export const TRUSTNET_PACKAGE_TYPES = Object.freeze({
  contacts: {
    module_id: 'contacts',
    label: 'Contacts / CRM',
    default_events: ['systems.customer.created', 'systems.vendor.created'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id'],
    approval_required_events: [],
    downstream_modules: ['accounting', 'customer', 'vendor', 'projects']
  },
  accounting: {
    module_id: 'accounting',
    label: 'Accounting',
    default_events: [
      'systems.invoice.created',
      'systems.payment.recorded',
      'systems.accounting.reconciliation_started',
      'systems.accounting.reconciliation_completed'
    ],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id', 'accounting_id'],
    approval_required_events: ['systems.invoice.created', 'systems.payment.recorded', 'systems.accounting.reconciliation_completed'],
    downstream_modules: ['comptroller', 'audit']
  },
  shipping: {
    module_id: 'shipping',
    label: 'Shipping',
    default_events: ['systems.shipment.created'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id', 'shipment_id'],
    approval_required_events: ['systems.shipment.created'],
    downstream_modules: ['customer', 'fulfillment', 'projects']
  },
  fulfillment: {
    module_id: 'fulfillment',
    label: 'Fulfillment',
    default_events: ['systems.fulfillment.started', 'systems.fulfillment.completed'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id', 'order_id'],
    approval_required_events: ['systems.fulfillment.completed'],
    downstream_modules: ['shipping', 'customer', 'projects']
  },
  logistics: {
    module_id: 'logistics',
    label: 'Logistics',
    default_events: ['systems.logistics.started', 'systems.logistics.completed'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id'],
    approval_required_events: ['systems.logistics.completed'],
    downstream_modules: ['vendor', 'shipping', 'fulfillment', 'projects']
  },
  projects: {
    module_id: 'projects',
    label: 'Projects',
    default_events: ['systems.order.created', 'systems.order.updated', 'systems.production.updated'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id', 'project_id'],
    approval_required_events: ['systems.order.updated', 'systems.production.updated'],
    downstream_modules: ['accounting', 'customer', 'fulfillment', 'shipping']
  },
  purchasing: {
    module_id: 'purchasing',
    label: 'Purchasing',
    default_events: ['systems.purchase_order.created'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id', 'vendor_id'],
    approval_required_events: ['systems.purchase_order.created'],
    downstream_modules: ['vendor', 'accounting', 'logistics']
  },
  assistant: {
    module_id: 'assistant',
    label: 'Neroa Assistant',
    default_events: ['systems.assistant.action_started', 'systems.assistant.action_completed', 'systems.assistant.action_blocked'],
    required_context: ['business_identity_number', 'business_address', 'business_id', 'workspace_id'],
    approval_required_events: ['systems.assistant.action_completed'],
    downstream_modules: ['neroa-one-brain', 'neroa-guard']
  }
});

export function getTrustNetPackageWiring(packageType) {
  return TRUSTNET_PACKAGE_TYPES[packageType] || null;
}

export function requireTrustNetPackageWiring(packageType) {
  const wiring = getTrustNetPackageWiring(packageType);
  if (!wiring) {
    throw new Error(`Unknown TrustNet package type: ${packageType}`);
  }
  return wiring;
}

export function moduleAddress({ packageType, business_identity_number, business_id, workspace_id, actor_type, actor_id, module_id } = {}) {
  const wiring = packageType ? requireTrustNetPackageWiring(packageType) : null;
  return trustAddress({
    system: 'neroa-systems',
    workspace_id,
    business_identity_number,
    business_id,
    module_id: module_id || wiring?.module_id || packageType,
    actor_type,
    actor_id
  });
}

export function buildTrustNetPackageReceipts({
  packageType,
  action,
  actor_type,
  actor_id,
  business_identity_number,
  business_address,
  business_id,
  customer_id,
  workspace_id,
  project_id,
  order_id,
  job_id,
  accounting_id,
  vendor_id,
  shipment_id,
  payload = {},
  approval_refs = [],
  evidence_refs = [],
  source_refs = [],
  auth_status = 'local_authenticated',
  store,
  event_type
} = {}) {
  const wiring = requireTrustNetPackageWiring(packageType);
  const adapter = createLocalTrustNetAdapter({ store });
  const eventTypes = event_type ? [event_type] : wiring.default_events;
  const from_address = moduleAddress({ packageType, business_identity_number, business_id, workspace_id, actor_type, actor_id });
  const receipts = [];

  for (const type of eventTypes) {
    const approvalRequired = wiring.approval_required_events.includes(type);
    const receipt = adapter.emitProofEvent({
      event_type: type,
      from_address,
      to_address: moduleAddress({ packageType, business_identity_number, business_id, workspace_id, module_id: wiring.module_id }),
      actor_type,
      actor_id,
      business_identity_number,
      business_address,
      business_id,
      customer_id,
      workspace_id,
      project_id,
      system_id: 'neroa-systems',
      module_id: wiring.module_id,
      order_id,
      job_id,
      accounting_id,
      vendor_id,
      shipment_id,
      payload: {
        package_type: packageType,
        action,
        summary: payload.summary || `${wiring.label} action requested`,
        downstream_modules: wiring.downstream_modules,
        ...payload
      },
      payload_redaction_class: payload.payload_redaction_class || 'metadata_only',
      evidence_refs,
      source_refs,
      approval_refs,
      auth_status,
      security_class: payload.security_class || 'bank_level',
      retention_class: payload.retention_class || 'audit_7y',
      customer_impacting_change: approvalRequired,
      policy_override: approvalRequired ? undefined : 'approval_not_required'
    });
    receipts.push(receipt);
  }

  return receipts;
}

export function createPackageInstallPlan(packageType) {
  const wiring = requireTrustNetPackageWiring(packageType);
  return {
    package_type: packageType,
    module_id: wiring.module_id,
    label: wiring.label,
    receipts_to_wire: wiring.default_events,
    required_context: wiring.required_context,
    approval_required_events: wiring.approval_required_events,
    downstream_modules: wiring.downstream_modules,
    guardrails: [
      'emit TrustNet receipt for every important action',
      'fail closed when required context is missing',
      'block customer-impacting changes without approval_refs',
      'keep customer-safe receipts redacted',
      'do not add wallet token gas custody bridge or mainnet behavior'
    ]
  };
}

export function createPackageInstallPlans(packageTypes = Object.keys(TRUSTNET_PACKAGE_TYPES)) {
  return packageTypes.map(createPackageInstallPlan);
}
