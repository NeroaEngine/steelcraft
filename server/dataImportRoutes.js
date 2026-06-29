function clean(value = '') {
  return String(value ?? '').trim();
}

function key(value = '') {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pick(row, names) {
  const entries = Object.entries(row || {}).map(([sourceKey, value]) => [key(sourceKey), value]);
  for (const name of names) {
    const found = entries.find(([sourceKey]) => sourceKey === key(name));
    if (found && clean(found[1])) return clean(found[1]);
  }
  return '';
}

function splitName(fullName) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function sourceId(prefix, fileName, rowIndex, fallback) {
  return `${prefix}:${clean(fileName) || 'upload'}:${rowIndex + 1}:${key(fallback) || 'row'}`.slice(0, 240);
}

async function ensureSimpleProjectTables(query) {
  await query(`
    CREATE TABLE IF NOT EXISTS project_delivery (
      id SERIAL PRIMARY KEY,
      project_name TEXT NOT NULL,
      manufacturer TEXT NOT NULL DEFAULT '',
      mbs_job_number TEXT NOT NULL DEFAULT '',
      engineering_status TEXT NOT NULL DEFAULT '',
      drawing_stage TEXT NOT NULL DEFAULT '',
      production_status TEXT NOT NULL DEFAULT '',
      delivery_date TEXT NOT NULL DEFAULT '',
      project_manager TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      source_file TEXT NOT NULL DEFAULT '',
      source_row INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS erection_schedule (
      id SERIAL PRIMARY KEY,
      project_name TEXT NOT NULL,
      delivery_date TEXT NOT NULL DEFAULT '',
      erection_start_date TEXT NOT NULL DEFAULT '',
      crew TEXT NOT NULL DEFAULT '',
      superintendent TEXT NOT NULL DEFAULT '',
      percent_complete TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      source_file TEXT NOT NULL DEFAULT '',
      source_row INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function importAccounts({ query, initCrmAccountsContactsSchema }, rows, fileName) {
  await initCrmAccountsContactsSchema();
  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const accountName = pick(row, ['Account Name', 'Account', 'Company', 'Customer', 'Organization', 'Name']);
    if (!accountName) {
      skipped += 1;
      errors.push(`Row ${index + 1}: missing account/company name`);
      continue;
    }

    await query(
      `INSERT INTO crm_accounts (account_name, account_type, domain, industry, description, headquarters_location, sales_estimating_link, source_board_id, source_board_name, monday_item_id, monday_group, raw_monday, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       ON CONFLICT (monday_item_id) DO UPDATE SET
         account_name=EXCLUDED.account_name,
         account_type=EXCLUDED.account_type,
         domain=EXCLUDED.domain,
         industry=EXCLUDED.industry,
         description=EXCLUDED.description,
         headquarters_location=EXCLUDED.headquarters_location,
         sales_estimating_link=EXCLUDED.sales_estimating_link,
         raw_monday=EXCLUDED.raw_monday,
         updated_at=NOW()`,
      [
        accountName,
        pick(row, ['Account Type', 'Type', 'Category']),
        pick(row, ['Domain', 'Website', 'URL']),
        pick(row, ['Industry']),
        pick(row, ['Description', 'Notes', 'Comments']),
        pick(row, ['Address', 'Headquarters', 'Location', 'Billing Address']),
        pick(row, ['Sales & Estimating', '*Sales & Estimating']),
        'spreadsheet',
        fileName,
        sourceId('spreadsheet-account', fileName, index, accountName),
        pick(row, ['Group', 'Status']),
        JSON.stringify(row),
      ]
    );
    imported += 1;
  }

  return { imported, skipped, errors };
}

async function importContacts(ctx, rows, fileName) {
  await ctx.initCrmAccountsContactsSchema();
  const accountResult = await importAccounts(ctx, rows, fileName);
  const accountRows = await ctx.query('SELECT * FROM crm_accounts ORDER BY account_name');
  const accountsByName = new Map(accountRows.rows.map((account) => [key(account.account_name), account]));

  let imported = 0;
  let skipped = 0;
  let matched = 0;
  let unmatched = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const fullName = pick(row, ['Full Name', 'Name', 'Contact', 'Contact Name', 'Person']);
    const email = pick(row, ['Email', 'Email Address', 'E-mail']);
    const phone = pick(row, ['Phone', 'Phone Number', 'Mobile', 'Cell']);
    const company = pick(row, ['Company', 'Account', 'Customer', 'Organization', 'Linked Account']);

    if (!fullName && !email) {
      skipped += 1;
      errors.push(`Row ${index + 1}: missing contact name/email`);
      continue;
    }

    const name = fullName || email;
    const { firstName, lastName } = splitName(name);
    const account = accountsByName.get(key(company)) || null;
    if (account) matched += 1;
    else unmatched += 1;

    await ctx.query(
      `INSERT INTO crm_contacts (account_id, full_name, first_name, last_name, contact_type, title, phone, email, linked_account_text, company_text, sales_estimating_link, source_board_id, source_board_name, monday_item_id, monday_group, raw_monday, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
       ON CONFLICT (monday_item_id) DO UPDATE SET
         account_id=EXCLUDED.account_id,
         full_name=EXCLUDED.full_name,
         first_name=EXCLUDED.first_name,
         last_name=EXCLUDED.last_name,
         contact_type=EXCLUDED.contact_type,
         title=EXCLUDED.title,
         phone=EXCLUDED.phone,
         email=EXCLUDED.email,
         linked_account_text=EXCLUDED.linked_account_text,
         company_text=EXCLUDED.company_text,
         sales_estimating_link=EXCLUDED.sales_estimating_link,
         raw_monday=EXCLUDED.raw_monday,
         updated_at=NOW()`,
      [
        account?.id || null,
        name,
        firstName,
        lastName,
        pick(row, ['Contact Type', 'Type']),
        pick(row, ['Title', 'Job Title', 'Role']),
        phone,
        email,
        company,
        company,
        pick(row, ['Sales & Estimating', '*Sales & Estimating']),
        'spreadsheet',
        fileName,
        sourceId('spreadsheet-contact', fileName, index, email || name),
        pick(row, ['Group', 'Status']),
        JSON.stringify(row),
      ]
    );
    imported += 1;
  }

  return {
    accountsImported: accountResult.imported,
    imported,
    skipped,
    matched,
    unmatched,
    errors: [...accountResult.errors, ...errors],
  };
}

async function importProjectDelivery({ query }, rows, fileName) {
  await ensureSimpleProjectTables(query);
  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const projectName = pick(row, ['Project Name', 'Project', 'Job Name', 'Job', 'Name']);
    if (!projectName) {
      skipped += 1;
      errors.push(`Row ${index + 1}: missing project name`);
      continue;
    }
    await query(
      `INSERT INTO project_delivery (project_name, manufacturer, mbs_job_number, engineering_status, drawing_stage, production_status, delivery_date, project_manager, notes, source_file, source_row, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
      [projectName, pick(row, ['Manufacturer', 'Vendor']), pick(row, ['MBS Job Number', 'MBS Job #', 'Manufacturer Job Number']), pick(row, ['Engineering Status', 'Engineering']), pick(row, ['Drawing Stage', 'Drawings']), pick(row, ['Production Status', 'Production']), pick(row, ['Delivery Date', 'Building Delivery Date']), pick(row, ['Project Manager', 'PM']), pick(row, ['Notes', 'Comments']), fileName, index + 1]
    );
    imported += 1;
  }
  return { imported, skipped, errors };
}

async function importErectionSchedule({ query }, rows, fileName) {
  await ensureSimpleProjectTables(query);
  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const projectName = pick(row, ['Project Name', 'Project', 'Job Name', 'Job', 'Name']);
    if (!projectName) {
      skipped += 1;
      errors.push(`Row ${index + 1}: missing project name`);
      continue;
    }
    await query(
      `INSERT INTO erection_schedule (project_name, delivery_date, erection_start_date, crew, superintendent, percent_complete, status, notes, source_file, source_row, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [projectName, pick(row, ['Delivery Date', 'Building Delivery Date']), pick(row, ['Erection Start Date', 'Erection Start', 'Start Date']), pick(row, ['Crew', 'Crew Assignment', 'Subcontractor']), pick(row, ['Superintendent', 'Super']), pick(row, ['Percent Complete', '% Complete', 'Complete']), pick(row, ['Status', 'Erection Status']), pick(row, ['Notes', 'Comments']), fileName, index + 1]
    );
    imported += 1;
  }
  return { imported, skipped, errors };
}

export function registerDataImportRoutes(app, context) {
  app.post('/api/data-import/:kind', async (req, res) => {
    try {
      const kind = String(req.params.kind || '').trim();
      const fileName = clean(req.body?.fileName || 'spreadsheet-upload');
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      if (!rows.length) return res.status(400).json({ ok: false, error: 'No rows were provided for import.' });

      let result;
      if (kind === 'contacts') result = await importContacts(context, rows, fileName);
      else if (kind === 'accounts') result = await importAccounts(context, rows, fileName);
      else if (kind === 'project-delivery') result = await importProjectDelivery(context, rows, fileName);
      else if (kind === 'erection-schedule') result = await importErectionSchedule(context, rows, fileName);
      else return res.status(400).json({ ok: false, error: `Unsupported import kind: ${kind}` });

      res.json({
        ok: true,
        kind,
        fileName,
        rowsRead: rows.length,
        ...result,
        receipt: {
          id: `${kind}-${Date.now()}`,
          source: fileName,
          importedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
}
