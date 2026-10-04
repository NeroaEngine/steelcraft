export async function ensureCrmCommunicationSchema(db) {
  await db.query(`
    create table if not exists crm_companies (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      company_name text not null,
      company_type text not null default 'unknown',
      status text not null default 'draft',
      source text not null default 'manual',
      owner_user_id text,
      approved_for_accounting boolean not null default false,
      approved_for_sales boolean not null default false,
      approved_for_estimating boolean not null default false,
      approved_for_customer_portal boolean not null default false,
      approved_for_vendor_portal boolean not null default false,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists crm_people (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      company_id bigint references crm_companies(id) on delete set null,
      full_name text not null,
      role_title text,
      email text,
      phone text,
      status text not null default 'draft',
      preferred_channel text not null default 'email',
      timezone text,
      quiet_hours jsonb not null default '{}'::jsonb,
      sms_consent_status text not null default 'unknown',
      voice_consent_status text not null default 'unknown',
      email_consent_status text not null default 'unknown',
      portal_access_status text not null default 'none',
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists crm_relationships (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      company_id bigint references crm_companies(id) on delete cascade,
      person_id bigint references crm_people(id) on delete cascade,
      relationship_type text not null,
      room_context text,
      entity_type text,
      entity_id text,
      status text not null default 'active',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists communication_providers (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      provider_key text not null,
      provider_label text not null,
      channel text not null,
      account_mode text not null default 'neroa_master',
      provisioning_scope text not null default 'tenant_subaccount',
      status text not null default 'planned',
      credentials_ref text,
      master_account_ref text,
      tenant_account_ref text,
      config jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, provider_key, channel)
    )
  `);
  await db.query(`alter table communication_providers add column if not exists account_mode text not null default 'neroa_master'`);
  await db.query(`alter table communication_providers add column if not exists provisioning_scope text not null default 'tenant_subaccount'`);
  await db.query(`alter table communication_providers add column if not exists master_account_ref text`);
  await db.query(`alter table communication_providers add column if not exists tenant_account_ref text`);
  await db.query(`
    create table if not exists communication_tenant_accounts (
      id bigserial primary key,
      tenant_id text not null,
      account_name text not null,
      account_status text not null default 'draft',
      provider_key text not null default 'neroa_provider',
      provider_channel text not null default 'multi',
      account_mode text not null default 'neroa_master_subaccount',
      master_account_ref text,
      provider_tenant_ref text,
      default_sms_from text,
      default_voice_from text,
      default_email_from text,
      allowed_channels jsonb not null default '["email","sms","voice","task"]'::jsonb,
      compliance_status text not null default 'setup_required',
      consent_policy jsonb not null default '{}'::jsonb,
      quiet_hours_policy jsonb not null default '{}'::jsonb,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, provider_key, provider_channel)
    )
  `);
  await db.query(`
    create table if not exists communication_sender_identities (
      id bigserial primary key,
      tenant_id text not null,
      tenant_account_id bigint references communication_tenant_accounts(id) on delete cascade,
      channel text not null,
      identity_type text not null,
      identity_value text not null,
      display_name text,
      status text not null default 'pending_setup',
      provider_key text not null default 'neroa_provider',
      provider_identity_ref text,
      compliance_status text not null default 'setup_required',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, channel, identity_value)
    )
  `);
  await db.query(`
    create table if not exists communication_threads (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      company_id bigint references crm_companies(id) on delete set null,
      person_id bigint references crm_people(id) on delete set null,
      room_context text not null default 'contacts',
      subject text,
      status text not null default 'open',
      assigned_owner text,
      intent text,
      priority text not null default 'normal',
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists communication_messages (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      thread_id bigint references communication_threads(id) on delete cascade,
      company_id bigint references crm_companies(id) on delete set null,
      person_id bigint references crm_people(id) on delete set null,
      direction text not null,
      channel text not null,
      provider_key text,
      provider_message_id text,
      subject text,
      body text,
      delivery_status text not null default 'draft',
      intent text,
      sentiment text,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists communication_jobs (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      company_id bigint references crm_companies(id) on delete set null,
      person_id bigint references crm_people(id) on delete set null,
      thread_id bigint references communication_threads(id) on delete set null,
      job_type text not null,
      channel text not null,
      provider_key text,
      scheduled_at timestamptz,
      status text not null default 'draft',
      approval_required boolean not null default true,
      approved_by text,
      approved_at timestamptz,
      payload jsonb not null default '{}'::jsonb,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists crm_merge_events (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      entity_type text not null,
      winning_entity_id text not null,
      merged_entity_ids jsonb not null default '[]'::jsonb,
      reason text,
      approved_by text,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
}

export async function provisionTenantCommunicationAccount(db, { tenantId = 'steelcraft', accountName = null, providerKey = 'neroa_provider', providerChannel = 'multi', channels = ['email', 'sms', 'voice', 'task'], actor = 'system', raw = {} } = {}) {
  await ensureCrmCommunicationSchema(db);
  const masterAccountRef = process.env.NEROA_COMMUNICATIONS_MASTER_ACCOUNT_REF || process.env.TWILIO_ACCOUNT_SID || process.env.TELNYX_ACCOUNT_ID || 'neroa_master_pending';
  const providerTenantRef = `${providerKey}:${tenantId}`;
  const result = await db.query(
    `insert into communication_tenant_accounts (tenant_id, account_name, account_status, provider_key, provider_channel, account_mode, master_account_ref, provider_tenant_ref, allowed_channels, compliance_status, consent_policy, quiet_hours_policy, raw)
     values ($1,$2,'setup_required',$3,$4,'neroa_master_subaccount',$5,$6,$7,'setup_required',$8,$9,$10)
     on conflict (tenant_id, provider_key, provider_channel) do update set
       account_name = excluded.account_name,
       master_account_ref = excluded.master_account_ref,
       provider_tenant_ref = excluded.provider_tenant_ref,
       allowed_channels = excluded.allowed_channels,
       raw = communication_tenant_accounts.raw || excluded.raw,
       updated_at = now()
     returning *`,
    [tenantId, accountName || `${tenantId} Neroa Communications`, providerKey, providerChannel, masterAccountRef, providerTenantRef, JSON.stringify(channels), { smsOptInRequired: true, voiceConsentRequired: true, emailUnsubscribeRequired: true }, { timezoneRequired: true, defaultQuietHours: '20:00-08:00' }, { ...raw, actor, provisionedThrough: 'neroa_master_provider' }]
  );
  await db.query(
    `insert into communication_providers (tenant_id, provider_key, provider_label, channel, account_mode, provisioning_scope, status, master_account_ref, tenant_account_ref, config)
     values ($1,$2,$3,$4,'neroa_master','tenant_subaccount','tenant_provisioned',$5,$6,$7)
     on conflict (tenant_id, provider_key, channel) do update set
       account_mode = excluded.account_mode,
       provisioning_scope = excluded.provisioning_scope,
       status = excluded.status,
       master_account_ref = excluded.master_account_ref,
       tenant_account_ref = excluded.tenant_account_ref,
       config = excluded.config,
       updated_at = now()`,
    [tenantId, providerKey, 'Neroa Communications API', providerChannel, masterAccountRef, providerTenantRef, { customerSees: 'Neroa Communications', actualPipe: providerKey, accountMode: 'through_neroa' }]
  );
  return result.rows[0];
}

export function getCrmCommunicationReadiness() {
  return {
    mode: 'level_1_and_level_2_provider_layer',
    note: 'Customers use Neroa Communications directly. Neroa owns routing, identity, queue, approvals, consent, timeline, audit, tenant provisioning, and provider failover. Twilio/Telnyx/Bandwidth/SendGrid/Neroa Mail can remain hidden pipes behind Neroa.',
    customerExperience: 'through_neroa_not_customer_owned_provider_account',
    requiredModules: [
      'canonical company/person records',
      'tenant communication account provisioning',
      'communication provider abstraction',
      'inbound email router',
      'SMS/call/email job queue',
      'consent and quiet-hours guardrails',
      'AI intent classification',
      'room handoff approvals',
      'Scan/Vault/Guard trace refs'
    ]
  };
}
