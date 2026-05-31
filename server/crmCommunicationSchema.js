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
      status text not null default 'planned',
      credentials_ref text,
      config jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, provider_key, channel)
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

export function getCrmCommunicationReadiness() {
  return {
    mode: 'provider_layer',
    note: 'Neroa CRM owns routing, identity, queue, approvals, consent, timeline, and audit. Twilio/Telnyx/Bandwidth/SendGrid/Neroa Mail are provider pipes only.',
    requiredModules: [
      'canonical company/person records',
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
