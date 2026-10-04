export async function ensureHrSchema(db) {
  await db.query(`
    create table if not exists employees (
      id bigserial primary key,
      first_name text not null,
      last_name text not null,
      preferred_name text,
      email text unique,
      phone text,
      role_title text,
      department text,
      employment_status text not null default 'active',
      employment_type text not null default 'salary',
      start_date date,
      manager_name text,
      emergency_contact_name text,
      emergency_contact_phone text,
      notes text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists pto_policies (
      id bigserial primary key,
      policy_name text not null,
      annual_hours numeric(8,2) not null default 0,
      carryover_hours numeric(8,2) not null default 0,
      applies_to text default 'salary',
      is_active boolean not null default true,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists pto_balances (
      id bigserial primary key,
      employee_id bigint not null references employees(id) on delete cascade,
      policy_id bigint references pto_policies(id),
      year integer not null,
      beginning_hours numeric(8,2) not null default 0,
      accrued_hours numeric(8,2) not null default 0,
      used_hours numeric(8,2) not null default 0,
      remaining_hours numeric(8,2) not null default 0,
      updated_at timestamptz not null default now(),
      unique (employee_id, year)
    );

    create table if not exists pto_requests (
      id bigserial primary key,
      employee_id bigint not null references employees(id) on delete cascade,
      request_type text not null default 'pto',
      start_date date not null,
      end_date date not null,
      hours_requested numeric(8,2) not null default 0,
      status text not null default 'pending',
      reason text,
      manager_name text,
      approved_by text,
      approved_at timestamptz,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists company_holidays (
      id bigserial primary key,
      holiday_name text not null,
      holiday_date date not null,
      year integer generated always as (extract(year from holiday_date)::integer) stored,
      is_paid boolean not null default true,
      notes text,
      created_at timestamptz not null default now(),
      unique (holiday_date, holiday_name)
    );

    create table if not exists handbook_documents (
      id bigserial primary key,
      title text not null,
      version text not null default '1.0',
      file_url text,
      effective_date date,
      is_active boolean not null default true,
      summary text,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists handbook_acknowledgements (
      id bigserial primary key,
      handbook_id bigint not null references handbook_documents(id) on delete cascade,
      employee_id bigint not null references employees(id) on delete cascade,
      status text not null default 'pending',
      signed_name text,
      signed_at timestamptz,
      ip_address text,
      signature_payload jsonb,
      created_at timestamptz not null default now(),
      unique (handbook_id, employee_id)
    );

    create table if not exists onboarding_checklists (
      id bigserial primary key,
      employee_id bigint not null references employees(id) on delete cascade,
      checklist_name text not null default 'New Employee Onboarding',
      status text not null default 'open',
      due_date date,
      completed_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists onboarding_tasks (
      id bigserial primary key,
      checklist_id bigint not null references onboarding_checklists(id) on delete cascade,
      task_name text not null,
      task_description text,
      owner_role text,
      status text not null default 'pending',
      due_date date,
      completed_at timestamptz,
      sort_order integer not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists training_courses (
      id bigserial primary key,
      course_name text not null,
      course_category text,
      description text,
      required_for_roles text[],
      software_name text,
      renewal_period_months integer,
      is_active boolean not null default true,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists training_lessons (
      id bigserial primary key,
      course_id bigint not null references training_courses(id) on delete cascade,
      lesson_title text not null,
      lesson_type text not null default 'content',
      content_url text,
      content_body text,
      sort_order integer not null default 0,
      created_at timestamptz not null default now()
    );

    create table if not exists employee_training_assignments (
      id bigserial primary key,
      employee_id bigint not null references employees(id) on delete cascade,
      course_id bigint not null references training_courses(id) on delete cascade,
      status text not null default 'assigned',
      assigned_at timestamptz not null default now(),
      due_date date,
      completed_at timestamptz,
      score numeric(6,2),
      acknowledgement_required boolean not null default false,
      acknowledged_at timestamptz,
      unique (employee_id, course_id)
    );
  `);
}
