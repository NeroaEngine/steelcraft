import { ensureAuthSchema } from './authSchema.js';
import {
  ROLE_CLASS_BY_ERP_ROLE,
  createOrResolveAuthorityUser,
  normalizeBusinessAuthorityId,
  recordAuthorityAction,
  resolveOrCreateBusinessAuthority
} from './authoritySchema.js';

function required(value, label) {
  if (!value) {
    const error = new Error(`${label} is required.`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function normalizeTenantKey(value, legalName = 'business') {
  return String(value || legalName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'business';
}

export function registerErpAuthorityOnboardingRoutes(app, requireDatabase, ensureSchema) {
  app.post('/api/erp/onboarding/business-authority', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      await ensureAuthSchema(db);

      const hasExistingBusinessAuthority = Boolean(req.body?.hasExistingBusinessAuthority ?? req.body?.has_existing_business_authority);
      const existingBusinessAuthorityId = req.body?.businessAuthorityId || req.body?.business_authority_id || req.body?.authorityDisplayId || req.body?.authority_display_id || null;
      const legalName = required(req.body?.businessName || req.body?.business_name || req.body?.legalName || req.body?.legal_name, 'businessName');
      const tenantKey = normalizeTenantKey(req.body?.tenantKey || req.body?.tenant_key, legalName);
      const email = required(req.body?.email, 'email');
      const fullName = required(req.body?.fullName || req.body?.full_name, 'fullName');
      const erpRole = req.body?.role || req.body?.erpRole || req.body?.erp_role || 'admin';

      if (hasExistingBusinessAuthority) required(existingBusinessAuthorityId, 'businessAuthorityId');

      const authorityAccount = await resolveOrCreateBusinessAuthority(db, {
        existingBusinessAuthorityId,
        hasExistingBusinessAuthority,
        legalName,
        tenantKey,
        raw: {
          source: 'erp_business_authority_onboarding',
          provided_existing_busv: hasExistingBusinessAuthority,
          requested_business_authority_id: existingBusinessAuthorityId || null
        }
      });

      const authorityUser = await createOrResolveAuthorityUser(db, {
        authorityAccount,
        email,
        fullName,
        erpRole,
        roleClass: ROLE_CLASS_BY_ERP_ROLE[erpRole] || '14',
        authorityUserDisplayId: req.body?.authorityUserDisplayId || req.body?.authority_user_display_id || null,
        raw: { source: 'erp_business_authority_onboarding' }
      });

      const userResult = await db.query(
        `insert into erp_users (email, full_name, role, role_class, language, status, must_change_password, raw, authority_account_id, authority_user_id, authority_display_id, authority_user_display_id)
         values ($1,$2,$3,$4,$5,'pending',true,$6,$7,$8,$9,$10)
         on conflict (email) do update set
           full_name = excluded.full_name,
           role = excluded.role,
           role_class = excluded.role_class,
           authority_account_id = excluded.authority_account_id,
           authority_user_id = excluded.authority_user_id,
           authority_display_id = excluded.authority_display_id,
           authority_user_display_id = excluded.authority_user_display_id,
           updated_at = now()
         returning id, email, full_name, role, role_class, status, authority_display_id, authority_user_display_id`,
        [
          email,
          fullName,
          erpRole,
          authorityUser.role_class,
          req.body?.language || 'en',
          {
            source: 'erp_business_authority_onboarding',
            hasExistingBusinessAuthority,
            normalizedBusinessAuthorityId: normalizeBusinessAuthorityId(existingBusinessAuthorityId || authorityAccount.display_id)
          },
          authorityAccount.id,
          authorityUser.id,
          authorityAccount.display_id,
          authorityUser.display_id
        ]
      );
      const erpUser = userResult.rows[0];

      const event = await recordAuthorityAction(db, {
        authorityAccount,
        authorityUser,
        actionType: hasExistingBusinessAuthority ? 'erp_login_created_under_existing_busv' : 'erp_login_created_with_new_busv',
        metadata: {
          source_table: 'erp_users',
          source_record_id: String(erpUser.id),
          tenantKey,
          email,
          businessName: legalName,
          hasExistingBusinessAuthority,
          authorityDisplayId: authorityAccount.display_id,
          authorityUserDisplayId: authorityUser.display_id
        }
      });

      res.json({
        ok: true,
        requiresPasswordSetup: true,
        authorityQuestionAnswered: true,
        hasExistingBusinessAuthority,
        authorityAccount: {
          id: authorityAccount.id,
          displayId: authorityAccount.display_id,
          legalName: authorityAccount.legal_name,
          tenantKey: authorityAccount.tenant_key
        },
        authorityUser: {
          id: authorityUser.id,
          displayId: authorityUser.display_id,
          roleClass: authorityUser.role_class
        },
        erpUser,
        vault: {
          vaultLineageId: event.vault_lineage_id,
          guardReceiptId: event.guard_receipt_id,
          scanEventId: event.scan_event_id
        }
      });
    } catch (error) {
      next(error);
    }
  });
}
