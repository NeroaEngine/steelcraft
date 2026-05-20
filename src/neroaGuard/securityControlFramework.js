export const NEROA_SECURITY_CONTROL_LAYER = 'Neroa Platform Security Controls';

export const NEROA_SECURITY_GATES = Object.freeze([
  'public_app_gate',
  'private_runner_gate',
  'api_gate',
  'mail_service_gate',
  'login_auth_session_gate',
  'device_obd_telematics_gate',
  'erp_business_system_gate',
  'vault_storage_gate',
  'worker_ai_execution_gate',
  'repo_build_lane_gate',
  'deployment_preview_gate',
  'customer_project_tenant_boundary_gate',
  'file_message_upload_boundary_gate',
  'infrastructure_provider_gate'
]);

export const NEROA_CONTROL_FAMILIES = Object.freeze([
  'access_control',
  'asset_boundary',
  'identity_session',
  'data_protection',
  'logging_monitoring',
  'incident_response',
  'third_party_provider',
  'configuration_change',
  'business_continuity',
  'risk_management',
  'auditable_evidence',
  'trustnet_receipt',
  'vault_lineage'
]);

export const NEROA_SECURITY_SEVERITIES = Object.freeze([
  'low',
  'medium',
  'high',
  'critical'
]);

export const NEROA_AUDITOR_WATCH_AREAS = Object.freeze([
  'ai_usage',
  'credit_usage',
  'login_behavior',
  'api_calls',
  'mail_activity',
  'erp_activity',
  'vault_storage_activity',
  'hosted_site_traffic',
  'obd_telematics_data_flow',
  'runner_behavior',
  'worker_outputs',
  'lane_packet_activity',
  'deployment_preview_behavior',
  'file_message_upload_activity',
  'customer_project_boundary_activity',
  'provider_infrastructure_changes',
  'suspicious_cross_system_movement'
]);

export const NEROA_AUDITOR_FORBIDDEN_ACTIONS = Object.freeze([
  'delete_data',
  'rotate_secrets',
  'block_customers',
  'deploy_fixes',
  'mutate_infrastructure',
  'destructive_action'
]);

export const NEROA_SECURITY_ESCALATION = Object.freeze({
  low: {
    handler: 'mini_auditor_model',
    required_flow: ['detect', 'trustnet_receipt', 'vault_lineage', 'continue_monitoring'],
    neuro_1_required: false,
    incident_lane_allowed: false
  },
  medium: {
    handler: 'security_review_model',
    required_flow: ['detect', 'trustnet_receipt', 'vault_lineage', 'core_policy_review', 'recommend_escalation'],
    neuro_1_required: false,
    incident_lane_allowed: false
  },
  high: {
    handler: 'neuro_1_escalation',
    required_flow: ['detect', 'trustnet_receipt', 'vault_lineage', 'core_policy_review', 'neuro_1_final_decision'],
    neuro_1_required: true,
    incident_lane_allowed: true
  },
  critical: {
    handler: 'neuro_1_incident_response',
    required_flow: ['detect', 'trustnet_receipt', 'vault_lineage', 'core_policy_review', 'neuro_1_final_decision', 'gpt_5_4_incident_response_lane'],
    neuro_1_required: true,
    incident_lane_allowed: true
  }
});

export const NEROA_GATE_REQUIRED_FIELDS = Object.freeze([
  'gate_type',
  'actor_type',
  'actor_id',
  'source_address',
  'target_address',
  'system_id',
  'resource_id',
  'business_identity_number',
  'business_address',
  'workspace_id',
  'policy_result'
]);

export const NEROA_SECURITY_SIGNAL_REQUIRED_FIELDS = Object.freeze([
  'signal_id',
  'severity',
  'watch_area',
  'gate_type',
  'actor_type',
  'actor_id',
  'source_address',
  'target_address',
  'system_id',
  'resource_id',
  'business_identity_number',
  'business_address',
  'workspace_id',
  'evidence_refs',
  'source_refs'
]);

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function validateSecurityGateContext(context = {}) {
  const checks = [];
  const blockedReasons = [];
  for (const field of NEROA_GATE_REQUIRED_FIELDS) {
    if (isMissing(context[field])) {
      checks.push({ check: `${field}_required`, status: 'blocked', reason: `${field} is missing` });
      blockedReasons.push(`${field} is missing`);
    } else {
      checks.push({ check: `${field}_required`, status: 'passed' });
    }
  }
  if (!NEROA_SECURITY_GATES.includes(context.gate_type)) {
    checks.push({ check: 'known_gate_type', status: 'blocked', reason: 'gate_type is unknown' });
    blockedReasons.push('gate_type is unknown');
  } else {
    checks.push({ check: 'known_gate_type', status: 'passed' });
  }
  return {
    allowed: blockedReasons.length === 0,
    policy_result: blockedReasons.length === 0 ? 'allowed' : 'blocked',
    policy_checks: checks,
    blocked_reason: blockedReasons.join('; ') || null
  };
}

export function validateSecuritySignal(signal = {}) {
  const checks = [];
  const blockedReasons = [];
  for (const field of NEROA_SECURITY_SIGNAL_REQUIRED_FIELDS) {
    if (isMissing(signal[field])) {
      checks.push({ check: `${field}_required`, status: 'blocked', reason: `${field} is missing` });
      blockedReasons.push(`${field} is missing`);
    } else {
      checks.push({ check: `${field}_required`, status: 'passed' });
    }
  }
  if (!NEROA_SECURITY_SEVERITIES.includes(signal.severity)) {
    checks.push({ check: 'known_severity', status: 'blocked', reason: 'severity is unknown' });
    blockedReasons.push('severity is unknown');
  } else {
    checks.push({ check: 'known_severity', status: 'passed' });
  }
  if (!NEROA_AUDITOR_WATCH_AREAS.includes(signal.watch_area)) {
    checks.push({ check: 'known_watch_area', status: 'blocked', reason: 'watch_area is unknown' });
    blockedReasons.push('watch_area is unknown');
  } else {
    checks.push({ check: 'known_watch_area', status: 'passed' });
  }
  if (!NEROA_SECURITY_GATES.includes(signal.gate_type)) {
    checks.push({ check: 'known_gate_type', status: 'blocked', reason: 'gate_type is unknown' });
    blockedReasons.push('gate_type is unknown');
  } else {
    checks.push({ check: 'known_gate_type', status: 'passed' });
  }
  if (signal.requested_action && NEROA_AUDITOR_FORBIDDEN_ACTIONS.includes(signal.requested_action)) {
    checks.push({ check: 'auditor_non_destructive', status: 'blocked', reason: 'Auditor cannot perform destructive or infrastructure-mutating action' });
    blockedReasons.push('Auditor cannot perform destructive or infrastructure-mutating action');
  } else {
    checks.push({ check: 'auditor_non_destructive', status: 'passed' });
  }
  return {
    allowed: blockedReasons.length === 0,
    policy_result: blockedReasons.length === 0 ? 'allowed' : 'blocked',
    policy_checks: checks,
    blocked_reason: blockedReasons.join('; ') || null
  };
}

export function classifyAuditorSignal(signal = {}) {
  const validation = validateSecuritySignal(signal);
  const severity = NEROA_SECURITY_SEVERITIES.includes(signal.severity) ? signal.severity : 'medium';
  const escalation = NEROA_SECURITY_ESCALATION[severity];
  return {
    ...validation,
    severity,
    handler: escalation.handler,
    neuro_1_required: escalation.neuro_1_required,
    incident_lane_allowed: escalation.incident_lane_allowed,
    required_flow: escalation.required_flow
  };
}

export function createSecurityControlPacket(input = {}) {
  const classification = classifyAuditorSignal(input);
  return {
    security_layer: NEROA_SECURITY_CONTROL_LAYER,
    signal_id: input.signal_id || null,
    severity: classification.severity,
    gate_type: input.gate_type || null,
    watch_area: input.watch_area || null,
    actor_type: input.actor_type || null,
    actor_id: input.actor_id || null,
    source_address: input.source_address || null,
    target_address: input.target_address || null,
    system_id: input.system_id || null,
    resource_id: input.resource_id || null,
    business_identity_number: input.business_identity_number || null,
    business_address: input.business_address || null,
    business_id: input.business_id || null,
    customer_id: input.customer_id || null,
    workspace_id: input.workspace_id || null,
    project_id: input.project_id || null,
    evidence_refs: input.evidence_refs || [],
    source_refs: input.source_refs || [],
    approval_refs: input.approval_refs || [],
    policy_result: classification.policy_result,
    policy_checks: classification.policy_checks,
    blocked_reason: classification.blocked_reason,
    handler: classification.handler,
    neuro_1_required: classification.neuro_1_required,
    incident_lane_allowed: classification.incident_lane_allowed,
    required_flow: classification.required_flow,
    control_families: NEROA_CONTROL_FAMILIES,
    destructive_action_allowed: false,
    final_decision_authority: classification.neuro_1_required ? 'Neuro-1' : 'Core policy unless escalated'
  };
}
