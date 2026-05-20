# Neroa platform security foundation

Security starts at the foundation. Every Neroa gate, API, service, runner, hosted site, infrastructure layer, storage system, mail service, Vault, business-system module, OBD/telematics monitor, worker lane, and deployment path must operate under Neroa security controls.

This foundation maps Neroa controls against SMPS2 / S2-style control thinking and C3M2-style cybersecurity maturity where appropriate, while using Neroa Guard / TrustNet for proof receipts and Neroa Vault for evidence and lineage.

## Platform posture

- Every Neroa system is gated.
- Every sensitive action is checked.
- Every important event is receipted.
- Every source-backed event has lineage.
- Every suspicious signal reports upward.
- Every serious threat reaches Neuro-1.
- Neuro-1 is the final word for confirmed threats, containment posture, and incident-response activation.

## Gate coverage

The security-control framework covers:

- public app gates
- private runner gates
- API gates
- mail service gates
- login/auth/session gates
- device/OBD/telematics gates
- business-system gates
- Vault and storage gates
- worker/AI execution gates
- repo/build lane gates
- deployment/preview gates
- customer/project/tenant boundaries
- file/message/upload boundaries
- infrastructure/provider boundaries

## Required security context

Every protected action should identify:

- who or what initiated the action
- where the action came from
- what system/resource it targeted
- what customer/project/workspace it belongs to
- whether the action was allowed or blocked
- what evidence supports it
- whether approval was required
- what receipt was created
- what Vault lineage/context is attached

## Auditor model

The Auditor is a platform-wide security patrol layer. It is not a separate brain.

The Auditor detects, classifies, reports, and recommends escalation. It cannot independently delete data, rotate secrets, block customers, deploy fixes, mutate infrastructure, or take destructive action.

### Auditor watch areas

- AI usage
- credit usage
- login behavior
- API calls
- mail activity
- business-system activity
- Vault/storage activity
- hosted-site traffic
- OBD/telematics data flow
- runner behavior
- worker outputs
- lane packet activity
- deployment/preview behavior
- file/message/upload activity
- customer/project boundary activity
- provider/infrastructure changes
- suspicious cross-system movement

## Escalation flow

```text
Auditor detects signal
→ Guard / TrustNet records a proof receipt
→ Vault attaches evidence and lineage
→ Core applies policy, boundaries, and approval rules
→ Neuro-1 receives escalation when severity requires it
→ Neuro-1 is the final word
```

Low severity signals remain with the mini auditor model for continued monitoring.

Medium severity signals route to a stronger security-review model.

High and critical severity signals escalate to Neuro-1. Critical incidents may activate the GPT-5.4-level incident-response lane, but that lane is reserved for serious security incidents only and does not control normal app operations.

## Implementation files

- `src/neroaGuard/securityControlFramework.js`

This file defines the local Systems-side foundation for gates, control families, watch areas, severity, signal validation, and escalation classification.

It does not add live central Guard, live central Vault, public-chain RPC, wallet, token, gas, mainnet, custody, or bridge behavior.
