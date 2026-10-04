const defaultSettings = {
  invoice_numbering: {
    prefix: 'SCB-INV-',
    nextNumber: 1001,
    allowCustomInvoiceNumber: false
  },
  quote_numbering: {
    prefix: 'SCB-Q-',
    nextNumber: 1001,
    allowCustomQuoteNumber: false
  },
  tax_location: {
    state: 'FL',
    county: 'Orange',
    city: 'Orlando',
    stateRate: 6,
    countyRate: 0.5,
    cityRate: 0,
    defaultTaxable: true
  }
};

export function defaultAccountingSettings() {
  return JSON.parse(JSON.stringify(defaultSettings));
}

export async function ensureAccountingSettingsSchema(db) {
  await db.query(`
    create table if not exists accounting_tenant_settings (
      id bigserial primary key,
      tenant_key text not null default 'steelcraft' unique,
      invoice_numbering jsonb not null default '{"prefix":"SCB-INV-","nextNumber":1001,"allowCustomInvoiceNumber":false}'::jsonb,
      quote_numbering jsonb not null default '{"prefix":"SCB-Q-","nextNumber":1001,"allowCustomQuoteNumber":false}'::jsonb,
      tax_location jsonb not null default '{"state":"FL","county":"Orange","city":"Orlando","stateRate":6,"countyRate":0.5,"cityRate":0,"defaultTaxable":true}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function seedAccountingSettings(db, tenantKey = 'steelcraft') {
  await ensureAccountingSettingsSchema(db);
  const defaults = defaultAccountingSettings();
  await db.query(
    `insert into accounting_tenant_settings (tenant_key, invoice_numbering, quote_numbering, tax_location)
     values ($1,$2,$3,$4)
     on conflict (tenant_key) do nothing`,
    [tenantKey, defaults.invoice_numbering, defaults.quote_numbering, defaults.tax_location]
  );
}

export async function getAccountingSettings(db, tenantKey = 'steelcraft') {
  await seedAccountingSettings(db, tenantKey);
  const result = await db.query(
    `select tenant_key, invoice_numbering, quote_numbering, tax_location, updated_at
     from accounting_tenant_settings
     where tenant_key = $1`,
    [tenantKey]
  );
  const row = result.rows[0];
  const defaults = defaultAccountingSettings();
  return {
    tenantKey,
    invoiceNumbering: { ...defaults.invoice_numbering, ...(row?.invoice_numbering || {}) },
    quoteNumbering: { ...defaults.quote_numbering, ...(row?.quote_numbering || {}) },
    taxLocation: { ...defaults.tax_location, ...(row?.tax_location || {}) },
    updatedAt: row?.updated_at || null
  };
}

export async function updateAccountingSettings(db, payload = {}, tenantKey = 'steelcraft') {
  await seedAccountingSettings(db, tenantKey);
  const current = await getAccountingSettings(db, tenantKey);
  const invoiceNumbering = payload.invoiceNumbering ? { ...current.invoiceNumbering, ...payload.invoiceNumbering } : current.invoiceNumbering;
  const quoteNumbering = payload.quoteNumbering ? { ...current.quoteNumbering, ...payload.quoteNumbering } : current.quoteNumbering;
  const taxLocation = payload.taxLocation ? { ...current.taxLocation, ...payload.taxLocation } : current.taxLocation;
  const result = await db.query(
    `update accounting_tenant_settings
     set invoice_numbering = $2,
         quote_numbering = $3,
         tax_location = $4,
         updated_at = now()
     where tenant_key = $1
     returning tenant_key, invoice_numbering, quote_numbering, tax_location, updated_at`,
    [tenantKey, invoiceNumbering, quoteNumbering, taxLocation]
  );
  const row = result.rows[0];
  return {
    tenantKey: row.tenant_key,
    invoiceNumbering: row.invoice_numbering,
    quoteNumbering: row.quote_numbering,
    taxLocation: row.tax_location,
    updatedAt: row.updated_at
  };
}

export async function reserveAccountingNumber(db, numberType = 'invoice', tenantKey = 'steelcraft') {
  await seedAccountingSettings(db, tenantKey);
  const column = numberType === 'quote' ? 'quote_numbering' : 'invoice_numbering';
  const allowKey = numberType === 'quote' ? 'allowCustomQuoteNumber' : 'allowCustomInvoiceNumber';
  const result = await db.query(
    `select ${column} as numbering from accounting_tenant_settings where tenant_key = $1 for update`,
    [tenantKey]
  );
  const numbering = result.rows[0]?.numbering || (numberType === 'quote' ? defaultSettings.quote_numbering : defaultSettings.invoice_numbering);
  const nextNumber = Number(numbering.nextNumber || 1);
  const value = `${numbering.prefix || ''}${String(nextNumber).padStart(4, '0')}`;
  const next = { ...numbering, nextNumber: nextNumber + 1, [allowKey]: Boolean(numbering[allowKey]) };
  await db.query(`update accounting_tenant_settings set ${column} = $2, updated_at = now() where tenant_key = $1`, [tenantKey, next]);
  return { value, numbering: next };
}
