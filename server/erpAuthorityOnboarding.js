import { ensureAuthSchema } from './authSchema.js';
import { recordAuthorityAction } from './authoritySchema.js';
import {
  AUTHORITY_START_MODES,
  BUSINESS_JOIN_METHODS,
  createAuthorityForSignup,
  createErpUserUnderAuthority,
  resolveExistingAuthorityForSignup
} from './authoritySignupGate.js';

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

function normalizeStartMode(body = {}) {
  if (body.authority_start_mode) return body.authority_start_mode;
  if (body.authorityStartMode) return body.authorityStartMode;
  if (body.hasExistingBusinessAuthority || body.has_existing_business_authority) return 'existing';
  return 'new_business';
}

export function registerErpAuthorityOnboardingRoutes(app, requireDatabase, ensureSchema) {
  app.get('/api/erp/onboarding/authority-start-options', async (req, res, next) => {
    try {
      res.json({
        ok: true,
        question: 'Do you already have a Neroa authority number?',
        helperText: 'Already have a Neroa authority number from Mail, Vault, Guard, Forge, Scan, ERP, or the ChatGPT app? Enter it here so we can connect this account to the right authority record.',
        options: [
          { value: 'existing', label: 'Yes, I have a PRV or BUSV number' },
          { value: 'new_personal', label: 'No, create a new personal account' },
          { value: 'new_business', label: 'No, create a new business account' }
        ],
        labels: { PRV: 'personal authority number', BUSV: 'business authority number' },
        businessJoinMethods: BUSINESS_JOIN_METHODS,
        rules: [
          'PRV/BUSV exists -> attach, do not duplicate.',
          'BUSV join -> never allow by number alone.',
          'Protected actions fail closed without resolved authority.'
        ]
      });
    } catch (error) { next(error); }
  });

  app.post('/api/erp/onboarding/authority-signup', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      await ensureAuthSchema(db);

      const mode = normalizeStartMode(req.body);
      if (!AUTHORITY_START_MODES.includes(mode)) {
        return res.status(400).json({ ok: false, error: 'authority_start_mode must be existing, new_personal, or new_business.' });
      }

      const email = required(req.body?.email, 'email');
      const fullName = required(req.body?.fullName || req.body?.full_name, 'fullName');
      const legalName = req.body?.businessName || req.body?.business_name || req.body?.legalName || req.body?.legal_name || fullName;
      const tenantKey = normalizeTenantKey(req.body?.tenantKey || req.body?.tenant_key, legalName);
      const erpRole = req.body?.role || req.body?.erpRole || req.body?.erp_role || (mode === 'new_business' ? 'admin' : 'customer');
      const language = req.body?.language || 'en';

      let resolved;
      if (mode === 'existing') {
        const existingAuthorityId = required(req.body?.existing_authority_id || req.body?.existingAuthorityId || req.body?.businessAuthorityId || req.body?.authorityDisplayId, 'existing_authority_id');
        resolved = await resolveExistingAuthorityForSignup(db, {
          existingAuthorityId,
          businessJoinMethod: req.body?.business_join_method || req.body?.businessJoinMethod || null,
          inviteToken: req.body?.invite_token || req.body?.inviteToken || null,
          email,
          fullName
        });
      } else {
        resolved = await createAuthorityForSignup(db, {
          mode,
          legalName: fullName,
          businessName: legalName,
          tenantKey
        });
      }

      const shouldCreateLogin = mode !== 'existing' || resolved.approvedForImmediateLogin;
      let erpUser = null;
      let authorityUser = null;
      if (shouldCreateLogin) {
        const created = await createErpUserUnderAuthority(db, {
          authorityAccount: resolved.authorityAccount,
          email,
          fullName,
          erpRole,
          language,
          status: 'pending',
          authorityUserDisplayId: req.body?.authorityUserDisplayId || req.body?.authority_user_display_id || null,
          raw: { source: 'erp_authority_signup_gate', authority_start_mode: mode }
        });
        erpUser = created.erpUser;
        authorityUser = created.authorityUser;
      }

      const event = await recordAuthorityAction(db, {
        authorityAccount: resolved.authorityAccount,
        authorityUser,
        actionType: mode === 'existing' ? 'erp_signup_existing_authority_gate_completed' : `erp_signup_${mode}_authority_created`,
        approvalRequired: Boolean(resolved.joinRequest && !resolved.approvedForImmediateLogin),
        metadata: {
          source_table: erpUser ? 'erp_users' : 'authority_join_requests',
          source_record_id: String(erpUser?.id || resolved.joinRequest?.id || resolved.authorityAccount.id),
          authority_start_mode: mode,
          tenantKey,
          email,
          businessJoinMethod: req.body?.business_join_method || req.body?.businessJoinMethod || null,
          startingUserCount: req.body?.starting_user_count || req.body?.startingUserCount || null
        }
      });

      res.json({
        ok: true,
        authorityStartMode: mode,
        requiresApproval: Boolean(resolved.joinRequest && !resolved.approvedForImmediateLogin),
        requiresPasswordSetup: Boolean(erpUser),
        authorityAccount: {
          id: resolved.authorityAccount.id,
          displayId: resolved.authorityAccount.display_id,
          authorityType: resolved.authorityAccount.authority_type,
          legalName: resolved.authorityAccount.legal_name,
          tenantKey: resolved.authorityAccount.tenant_key
        },
        authorityUser: authorityUser ? { id: authorityUser.id, displayId: authorityUser.display_id, roleClass: authorityUser.role_class } : null,
        joinRequest: resolved.joinRequest || null,
        erpUser,
        vault: {
          vaultLineageId: event.vault_lineage_id,
          guardReceiptId: event.guard_receipt_id,
          scanEventId: event.scan_event_id
        }
      });
    } catch (error) { next(error); }
  });

  app.post('/api/erp/onboarding/business-authority', async (req, res, next) => {
    req.body = {
      ...req.body,
      authority_start_mode: req.body?.hasExistingBusinessAuthority || req.body?.has_existing_business_authority ? 'existing' : 'new_business',
      existing_authority_id: req.body?.businessAuthorityId || req.body?.business_authority_id || req.body?.authorityDisplayId || req.body?.authority_display_id,
      business_join_method: req.body?.business_join_method || req.body?.businessJoinMethod || 'admin_approval'
    };
    return app._router.handle(req, res, next);
  });
}
