import { LocalTrustNetReceiptStore } from '../src/neroaGuard/trustNetGuard.js';
import { LocalVaultLineageStore } from '../src/neroaGuard/neroaVaultLineage.js';
import {
  emitContactCreatedWithReceiptAndLineage,
  emitCustomerCreatedWithReceiptAndLineage,
  emitVendorCreatedWithReceiptAndLineage
} from '../src/neroaGuard/contactsCrmTrustNet.js';

const contactsTrustStore = new LocalTrustNetReceiptStore();
const contactsVaultStore = new LocalVaultLineageStore();

function normalizeRecordType(value) {
  const normalized = String(value || 'contact').trim().toLowerCase();
  if (normalized === 'customer') return 'customer';
  if (normalized === 'vendor') return 'vendor';
  return 'contact';
}

function emitForRecordType(recordType, context) {
  if (recordType === 'customer') return emitCustomerCreatedWithReceiptAndLineage(context);
  if (recordType === 'vendor') return emitVendorCreatedWithReceiptAndLineage(context);
  return emitContactCreatedWithReceiptAndLineage(context);
}

function apiError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requireBodyField(body, field) {
  if (body[field] === undefined || body[field] === null || body[field] === '') {
    throw apiError(`${field} is required for Contacts / CRM create actions.`);
  }
}

function summarizeReceipt(receipt) {
  return {
    receipt_id: receipt.receipt_id,
    event_id: receipt.event_id,
    event_type: receipt.event_type,
    requested_event_type: receipt.requested_event_type,
    policy_result: receipt.policy_result,
    blocked_reason: receipt.blocked_reason,
    actor_id: receipt.actor_id,
    business_identity_number: receipt.business_identity_number,
    business_id: receipt.business_id,
    workspace_id: receipt.workspace_id,
    customer_id: receipt.customer_id,
    vendor_id: receipt.vendor_id,
    module_id: receipt.module_id,
    payload_redaction_class: receipt.payload_redaction_class,
    security_class: receipt.security_class,
    retention_class: receipt.retention_class,
    payload_hash: receipt.payload_hash,
    event_hash: receipt.event_hash,
    timestamp: receipt.timestamp
  };
}

function summarizeLineage(record) {
  return {
    lineage_id: record.lineage_id,
    receipt_id: record.receipt_id,
    event_id: record.event_id,
    module_name: record.module_name,
    action_id: record.action_id,
    policy_result: record.policy_result,
    blocked_reason: record.blocked_reason,
    redaction_class: record.redaction_class,
    retention_class: record.retention_class,
    created_at: record.created_at,
    created_by_actor: record.created_by_actor,
    lineage_hash: record.lineage_hash
  };
}

export function registerContactsCrmRoutes(app, requireDatabase, ensureSchema) {
  app.post('/api/contacts-crm/create', async (req, res, next) => {
    const db = requireDatabase();
    try {
      await ensureSchema();
      const body = req.body || {};
      const recordType = normalizeRecordType(body.record_type || body.type || body.company_type);

      requireBodyField(body, 'name');
      requireBodyField(body, 'actor_id');
      requireBodyField(body, 'business_identity_number');
      requireBodyField(body, 'business_address');
      requireBodyField(body, 'workspace_id');
      if (!Array.isArray(body.source_refs) || body.source_refs.length === 0) {
        throw apiError('source_refs are required for Contacts / CRM create actions.');
      }

      await db.query('begin');
      const companyResult = await db.query(
        `insert into companies (source, source_id, name, company_type, email, phone, raw, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, now(), now())
         returning id, source, source_id, name, company_type, email, phone, raw, created_at, updated_at`,
        [
          body.source || 'contacts_crm',
          body.source_id || null,
          body.name,
          recordType,
          body.email || null,
          body.phone || null,
          {
            company_name: body.company_name || body.name,
            notes: body.notes || null,
            workspace_id: body.workspace_id,
            business_identity_number: body.business_identity_number,
            project_id: body.project_id || null
          }
        ]
      );
      const company = companyResult.rows[0];
      const companyId = String(company.id);

      const proof = emitForRecordType(recordType, {
        actor_type: body.actor_type || 'user',
        actor_id: body.actor_id,
        business_identity_number: body.business_identity_number,
        business_address: body.business_address,
        business_id: body.business_id || null,
        workspace_id: body.workspace_id,
        customer_id: recordType === 'customer' ? (body.customer_id || companyId) : body.customer_id || null,
        vendor_id: recordType === 'vendor' ? (body.vendor_id || companyId) : body.vendor_id || null,
        contact_id: recordType === 'contact' ? (body.contact_id || companyId) : body.contact_id || null,
        project_id: body.project_id || null,
        from_address: body.from_address,
        to_address: body.to_address,
        name: body.name,
        email: body.email || null,
        company_name: body.company_name || body.name,
        notes: body.notes || null,
        payload: {
          summary: `${recordType} created through Contacts / CRM API`,
          company_id: companyId,
          company_type: recordType,
          source: company.source,
          source_id: company.source_id,
          ...body.payload
        },
        payload_redaction_class: body.payload_redaction_class || 'metadata_only',
        evidence_refs: body.evidence_refs || ['evidence:contacts-crm:api-create'],
        source_refs: body.source_refs,
        approval_refs: body.approval_refs || [],
        memory_refs: body.memory_refs || [],
        decision_refs: body.decision_refs || [],
        trustStore: contactsTrustStore,
        vaultStore: contactsVaultStore,
        customer_safe: body.customer_safe === true
      });

      if (!proof.ok) {
        await db.query('rollback');
        return res.status(400).json({
          ok: false,
          error: proof.blocked_reason,
          policy_result: proof.policy_result,
          receipt_id: proof.receipt_id,
          lineage_id: proof.lineage_id
        });
      }

      await db.query(
        `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata)
         values ($1, $2, $3, $4, $5)`,
        [
          body.actor_id,
          `${recordType}_created_with_trustnet_receipt`,
          'contacts_crm',
          companyId,
          {
            record_type: recordType,
            receipt_id: proof.receipt_id,
            lineage_id: proof.lineage_id,
            event_id: proof.event_id,
            business_identity_number: body.business_identity_number,
            workspace_id: body.workspace_id
          }
        ]
      );
      await db.query('commit');

      res.json({
        ok: true,
        record_type: recordType,
        company,
        receipt_id: proof.receipt_id,
        lineage_id: proof.lineage_id,
        event_id: proof.event_id,
        policy_result: proof.policy_result
      });
    } catch (error) {
      try { await db.query('rollback'); } catch {}
      next(error);
    }
  });

  app.get('/api/contacts-crm/proof-log', async (req, res) => {
    const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));
    const receipts = contactsTrustStore.all().slice(-limit).reverse().map(summarizeReceipt);
    const lineage = contactsVaultStore.all().slice(-limit).reverse().map(summarizeLineage);
    res.json({
      ok: true,
      receipts,
      lineage,
      counts: {
        receipts: contactsTrustStore.all().length,
        lineage: contactsVaultStore.all().length
      }
    });
  });
}

export function getContactsCrmLocalStores() {
  return {
    trustStore: contactsTrustStore,
    vaultStore: contactsVaultStore
  };
}
