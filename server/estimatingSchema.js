export async function ensureEstimatingSchema(db) {
  await db.query(`
    create table if not exists estimates (
      id bigserial primary key,
      project_id bigint references projects(id),
      estimate_number text,
      project_name text not null,
      estimator_name text,
      customer_company text,
      customer_contact text,
      customer_email text,
      customer_phone text,
      project_address text,
      city_state_zip text,
      local_tax_rate numeric(7,5) default 0.075,
      square_feet numeric(14,2) default 0,
      status text not null default 'draft',
      quote_po text,
      payment_terms text,
      scope_notes text,
      source_workbook text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists estimate_cost_lines (
      id bigserial primary key,
      estimate_id bigint not null references estimates(id) on delete cascade,
      section text not null default 'base',
      line_type text not null,
      description text not null,
      cost numeric(14,2) not null default 0,
      markup_rate numeric(8,5) not null default 0,
      tax_rate numeric(8,5) not null default 0,
      labor_amount numeric(14,2) not null default 0,
      sort_order integer not null default 0,
      is_optional boolean not null default false,
      is_accepted boolean not null default false,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists estimate_deposit_schedule (
      id bigserial primary key,
      estimate_id bigint not null references estimates(id) on delete cascade,
      deposit_type text not null,
      label text not null,
      percentage numeric(8,5) not null default 0,
      amount numeric(14,2) not null default 0,
      sort_order integer not null default 0,
      created_at timestamptz not null default now()
    );

    create table if not exists quotation_versions (
      id bigserial primary key,
      estimate_id bigint not null references estimates(id) on delete cascade,
      quote_type text not null,
      version_number integer not null default 1,
      status text not null default 'draft',
      quote_date date,
      expiration_date date,
      salesperson text,
      payment_terms text,
      notes text,
      subtotal numeric(14,2) not null default 0,
      tax numeric(14,2) not null default 0,
      labor_total numeric(14,2) not null default 0,
      total numeric(14,2) not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists quotation_lines (
      id bigserial primary key,
      quotation_id bigint not null references quotation_versions(id) on delete cascade,
      qty numeric(14,2) not null default 1,
      description text not null,
      unit_price numeric(14,2) not null default 0,
      line_total numeric(14,2) not null default 0,
      alternate_label text,
      acceptance_required boolean not null default false,
      sort_order integer not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists project_checklist_items (
      id bigserial primary key,
      project_id bigint references projects(id) on delete cascade,
      estimate_id bigint references estimates(id) on delete cascade,
      item_name text not null,
      scope_status text default 'select option',
      provider text,
      released_status text default 'select option',
      date_released date,
      delivery_date date,
      quantity numeric(14,2),
      sort_order integer not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists invoices (
      id bigserial primary key,
      project_id bigint references projects(id),
      estimate_id bigint references estimates(id),
      invoice_name text not null,
      invoice_number text,
      invoice_type text,
      invoice_date date,
      billing_contact text,
      payment_terms text,
      status text not null default 'draft',
      subtotal numeric(14,2) not null default 0,
      tax numeric(14,2) not null default 0,
      total numeric(14,2) not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists invoice_lines (
      id bigserial primary key,
      invoice_id bigint not null references invoices(id) on delete cascade,
      qty numeric(14,2) not null default 1,
      description text not null,
      unit_price numeric(14,2) not null default 0,
      line_total numeric(14,2) not null default 0,
      sort_order integer not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists schedule_of_values (
      id bigserial primary key,
      project_id bigint references projects(id),
      estimate_id bigint references estimates(id),
      sov_type text not null,
      draw_number integer,
      line_number integer,
      description text not null,
      scheduled_value numeric(14,2) not null default 0,
      previous_billed numeric(14,2) not null default 0,
      this_period numeric(14,2) not null default 0,
      balance_to_finish numeric(14,2) not null default 0,
      retainage numeric(14,2) not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists change_orders (
      id bigserial primary key,
      project_id bigint references projects(id),
      estimate_id bigint references estimates(id),
      co_number text not null,
      description text,
      date_sent date,
      amount_charged numeric(14,2) not null default 0,
      result text default 'pending',
      date_returned date,
      issued_number text,
      authorized_amount numeric(14,2) not null default 0,
      billed_on_draw text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}
