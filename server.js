import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

function toCamel(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  return out;
}

function rows(result) {
  return result.rows.map(toCamel);
}

async function query(text, params = []) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return pool.query(text, params);
}

async function runStatements(sql) {
  const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) {
    await query(statement);
  }
}

function canExecuteWebsiteOptimizations(access = {}) {
  return Boolean(
    access.githubRepoConnected ||
    access.cmsConnected ||
    access.uploadedSiteFiles ||
    access.domainOwnershipVerified
  );
}

async function initHrSchema() {
  await runStatements(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      manager TEXT NOT NULL DEFAULT '',
      employment_type TEXT NOT NULL DEFAULT 'Salary',
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      pto_balance NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pto_requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'PTO',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      hours NUMERIC NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hr_support_requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'Other',
      summary TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Open',
      assigned_to TEXT NOT NULL DEFAULT 'HR Admin',
      resolution TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS handbook_documents (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Steel Craft Employee Handbook',
      version TEXT NOT NULL,
      effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
      content_url TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS handbook_acknowledgements (
      id SERIAL PRIMARY KEY,
      handbook_id INTEGER REFERENCES handbook_documents(id) ON DELETE CASCADE,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(handbook_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS training_courses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS training_lessons (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS employee_training_assignments (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      completed_at TIMESTAMPTZ,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(course_id, employee_id)
    );
  `);
}

async function initCrmWebsiteSchema() {
  await runStatements(`
    CREATE TABLE IF NOT EXISTS crm_website_profiles (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL DEFAULT '',
      domain TEXT NOT NULL DEFAULT '',
      website_url TEXT NOT NULL,
      industry_guess TEXT NOT NULL DEFAULT '',
      business_summary TEXT NOT NULL DEFAULT '',
      service_summary TEXT NOT NULL DEFAULT '',
      lead_score INTEGER NOT NULL DEFAULT 0,
      seo_score INTEGER NOT NULL DEFAULT 0,
      trust_score INTEGER NOT NULL DEFAULT 0,
      conversion_score INTEGER NOT NULL DEFAULT 0,
      crawl_status TEXT NOT NULL DEFAULT 'Not crawled',
      last_crawled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_website_optimizer_access (
      id SERIAL PRIMARY KEY,
      website_profile_id INTEGER NOT NULL UNIQUE REFERENCES crm_website_profiles(id) ON DELETE CASCADE,
      github_repo_connected BOOLEAN NOT NULL DEFAULT FALSE,
      cms_connected BOOLEAN NOT NULL DEFAULT FALSE,
      uploaded_site_files BOOLEAN NOT NULL DEFAULT FALSE,
      domain_ownership_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verified_by_user_id INTEGER,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_website_pages (
      id SERIAL PRIMARY KEY,
      website_profile_id INTEGER NOT NULL REFERENCES crm_website_profiles(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      page_type TEXT NOT NULL DEFAULT 'public',
      title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      status_code INTEGER NOT NULL DEFAULT 0,
      indexed_allowed BOOLEAN NOT NULL DEFAULT TRUE,
      extracted_text_summary TEXT NOT NULL DEFAULT '',
      detected_ctas TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_website_recommendations (
      id SERIAL PRIMARY KEY,
      website_profile_id INTEGER NOT NULL REFERENCES crm_website_profiles(id) ON DELETE CASCADE,
      recommendation_type TEXT NOT NULL DEFAULT 'Recommendation',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      requires_source_access BOOLEAN NOT NULL DEFAULT FALSE,
      execution_status TEXT NOT NULL DEFAULT 'Recommendation-only',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function seedHrData() {
  const employeeCount = await query('SELECT COUNT(*)::int AS count FROM employees');
  if (employeeCount.rows[0].count === 0) {
    await query(`
      INSERT INTO employees (name, title, department, manager, employment_type, start_date, pto_balance, status) VALUES
      ('Avery Taylor', 'Project Manager', 'Operations', 'Seth Farrell', 'Salary', '2024-01-08', 88, 'Active'),
      ('Jordan Lee', 'Estimator', 'Sales & Estimating', 'Seth Farrell', 'Salary', '2023-08-21', 64, 'Active'),
      ('Morgan Wells', 'Shop Lead', 'Fabrication', 'Seth Farrell', 'Salary', '2022-03-14', 112, 'Active')
    `);
  }

  const handbookCount = await query('SELECT COUNT(*)::int AS count FROM handbook_documents');
  if (handbookCount.rows[0].count === 0) {
    await query(`INSERT INTO handbook_documents (title, version, effective_date, is_active) VALUES ('Steel Craft Employee Handbook', '2026.1', CURRENT_DATE, TRUE)`);
  }

  const trainingCount = await query('SELECT COUNT(*)::int AS count FROM training_courses');
  if (trainingCount.rows[0].count === 0) {
    const courses = [
      ['Company Process', 'Process', ['Portal overview', 'Internal communication', 'Daily project flow']],
      ['Safety', 'Safety', ['Jobsite basics', 'Shop safety', 'Incident reporting']],
      ['Software', 'Software', ['Monday workflows', 'Portal records', 'File procedures']],
      ['Estimating Workflow', 'Estimating', ['Estimate intake', 'Scope builder', 'Quote handoff']],
    ];
    const employees = await query('SELECT id FROM employees ORDER BY id');
    for (const [title, category, lessons] of courses) {
      const course = await query('INSERT INTO training_courses (title, category) VALUES ($1, $2) RETURNING id', [title, category]);
      const courseId = course.rows[0].id;
      for (let index = 0; index < lessons.length; index += 1) {
        await query('INSERT INTO training_lessons (course_id, title, sort_order) VALUES ($1, $2, $3)', [courseId, lessons[index], index + 1]);
      }
      for (const employee of employees.rows) {
        await query('INSERT INTO employee_training_assignments (course_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [courseId, employee.id]);
      }
    }
  }
}

async function seedCrmWebsiteData() {
  const profileCount = await query('SELECT COUNT(*)::int AS count FROM crm_website_profiles');
  if (profileCount.rows[0].count > 0) return;

  const profile = await query(
    `INSERT INTO crm_website_profiles (company_name, domain, website_url, industry_guess, business_summary, service_summary, lead_score, seo_score, trust_score, conversion_score, crawl_status, last_crawled_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id`,
    [
      'Prospect Company',
      'example.com',
      'https://example.com',
      'Local services',
      'Public website profile created for CRM lead intelligence.',
      'Services, contact paths, public calls to action, metadata, schema, and trust signals are ready for review.',
      78,
      64,
      72,
      58,
      'Public analysis ready',
    ]
  );
  const profileId = profile.rows[0].id;

  await query('INSERT INTO crm_website_optimizer_access (website_profile_id) VALUES ($1) ON CONFLICT DO NOTHING', [profileId]);
  await query(
    'INSERT INTO crm_website_pages (website_profile_id, url, page_type, title, meta_description, status_code, extracted_text_summary, detected_ctas) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [profileId, 'https://example.com', 'homepage', 'Example Domain', 'Public website analysis placeholder', 200, 'Homepage can be analyzed publicly without repo access.', ['Contact', 'Request quote']]
  );

  const recommendations = [
    ['Conversion', 'Improve homepage headline and primary call to action.', 'Visible as a recommendation without source access. Requires source access before execution.', true],
    ['SEO', 'Add service-area pages for target markets.', 'Recommendation can be generated from public data. Page creation requires CMS/repo/files access.', true],
    ['Schema', 'Add organization, local business, and service schema where appropriate.', 'Schema can be recommended publicly. Source changes require verified access.', true],
    ['Trust', 'Strengthen contact path with phone, quote request, and form visibility.', 'Can be discussed in outreach before source access is granted.', false],
  ];

  for (const [type, title, description, requiresAccess] of recommendations) {
    await query(
      'INSERT INTO crm_website_recommendations (website_profile_id, recommendation_type, title, description, requires_source_access) VALUES ($1,$2,$3,$4,$5)',
      [profileId, type, title, description, requiresAccess]
    );
  }
}

async function hrPayload() {
  const employees = rows(await query('SELECT * FROM employees ORDER BY id'));
  const ptoRequests = rows(await query('SELECT * FROM pto_requests ORDER BY created_at DESC, id DESC'));
  const supportRequests = rows(await query('SELECT * FROM hr_support_requests ORDER BY created_at DESC, id DESC'));
  const handbookRow = toCamel((await query('SELECT * FROM handbook_documents WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1')).rows[0]);
  const acknowledged = handbookRow ? rows(await query('SELECT employee_id FROM handbook_acknowledgements WHERE handbook_id = $1', [handbookRow.id])).map((row) => row.employeeId) : [];
  const courseRows = rows(await query('SELECT * FROM training_courses ORDER BY id'));
  const lessonRows = rows(await query('SELECT * FROM training_lessons ORDER BY sort_order, id'));
  const assignmentRows = rows(await query('SELECT * FROM employee_training_assignments ORDER BY id'));
  const training = courseRows.map((course) => ({
    ...course,
    lessons: lessonRows.filter((lesson) => lesson.courseId === course.id).map((lesson) => lesson.title),
    assignedTo: assignmentRows.filter((assignment) => assignment.courseId === course.id).map((assignment) => assignment.employeeId),
    completedBy: assignmentRows.filter((assignment) => assignment.courseId === course.id && assignment.completedAt).map((assignment) => assignment.employeeId),
  }));
  return {
    employees,
    ptoRequests,
    supportRequests,
    handbook: handbookRow ? { ...handbookRow, acknowledgedBy: acknowledged } : null,
    training,
  };
}

async function crmWebsitePayload() {
  await initCrmWebsiteSchema();
  await seedCrmWebsiteData();

  const profiles = rows(await query('SELECT * FROM crm_website_profiles ORDER BY updated_at DESC, id DESC'));
  const accessRows = rows(await query('SELECT * FROM crm_website_optimizer_access ORDER BY id'));
  const pageRows = rows(await query('SELECT * FROM crm_website_pages ORDER BY id'));
  const recommendationRows = rows(await query('SELECT * FROM crm_website_recommendations ORDER BY id'));

  return profiles.map((profile) => {
    const sourceAccess = accessRows.find((access) => access.websiteProfileId === profile.id) || {};
    return {
      ...profile,
      sourceAccess,
      canAnalyzeWebsite: true,
      canRecommendOptimizations: true,
      canExecuteOptimizations: canExecuteWebsiteOptimizations(sourceAccess),
      pages: pageRows.filter((page) => page.websiteProfileId === profile.id),
      recommendations: recommendationRows.filter((recommendation) => recommendation.websiteProfileId === profile.id),
    };
  });
}

async function crmWebsiteProfileWithAccess(profileId) {
  const profile = toCamel((await query('SELECT * FROM crm_website_profiles WHERE id = $1', [profileId])).rows[0]);
  if (!profile) return null;
  const sourceAccess = toCamel((await query('SELECT * FROM crm_website_optimizer_access WHERE website_profile_id = $1', [profileId])).rows[0]) || {};
  return {
    ...profile,
    sourceAccess,
    canExecuteOptimizations: canExecuteWebsiteOptimizations(sourceAccess),
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, checks: { app: 'ok', database: 'connected' } });
  } catch (error) {
    res.status(500).json({ ok: false, checks: { app: 'ok', database: 'error' }, error: error.message });
  }
});

app.post('/api/setup/schema', async (_req, res) => {
  try {
    await initHrSchema();
    await initCrmWebsiteSchema();
    await seedHrData();
    await seedCrmWebsiteData();
    res.json({ ok: true, message: 'HR and CRM Website Intelligence schemas initialized and seeded' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/hr/schema/status', async (_req, res) => {
  try {
    const result = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('employees','pto_requests','hr_support_requests','handbook_documents','handbook_acknowledgements','training_courses','training_lessons','employee_training_assignments')
      ORDER BY table_name
    `);
    res.json({ ok: true, tables: result.rows.map((row) => row.table_name) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/crm/website-intelligence/schema/status', async (_req, res) => {
  try {
    const result = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('crm_website_profiles','crm_website_optimizer_access','crm_website_pages','crm_website_recommendations')
      ORDER BY table_name
    `);
    res.json({ ok: true, tables: result.rows.map((row) => row.table_name) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/hr', async (_req, res) => {
  try {
    await initHrSchema();
    await seedHrData();
    res.json(await hrPayload());
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/hr/employees', async (_req, res) => {
  try { res.json(rows(await query('SELECT * FROM employees ORDER BY id'))); } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/employees', async (req, res) => {
  try {
    const { name, title = '', department = '', manager = '', startDate, ptoBalance = 0, status = 'Active' } = req.body;
    const result = await query(
      'INSERT INTO employees (name, title, department, manager, employment_type, start_date, pto_balance, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, title, department, manager, 'Salary', startDate || new Date().toISOString().slice(0, 10), ptoBalance, status]
    );
    res.status(201).json(toCamel(result.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/pto/requests', async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, hours, reason } = req.body;
    const result = await query(
      'INSERT INTO pto_requests (employee_id, type, start_date, end_date, hours, reason, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [employeeId, type, startDate, endDate, hours, reason || '', 'Pending']
    );
    res.status(201).json(toCamel(result.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/pto/requests/:id/approve', async (req, res) => {
  try {
    const result = await query('UPDATE pto_requests SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW() WHERE id = $3 RETURNING *', ['Approved', req.body?.adminNote || '', req.params.id]);
    res.json(toCamel(result.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/pto/requests/:id/deny', async (req, res) => {
  try {
    const result = await query('UPDATE pto_requests SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW() WHERE id = $3 RETURNING *', ['Denied', req.body?.adminNote || '', req.params.id]);
    res.json(toCamel(result.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/concerns', async (req, res) => {
  try {
    const { employeeId, category, summary } = req.body;
    const result = await query('INSERT INTO hr_support_requests (employee_id, category, summary, status, assigned_to) VALUES ($1,$2,$3,$4,$5) RETURNING *', [employeeId, category, summary, 'Open', 'HR Admin']);
    res.status(201).json(toCamel(result.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/hr/concerns/:id', async (req, res) => {
  try {
    const { status = 'Resolved', resolution = 'Resolved by HR Admin' } = req.body;
    const result = await query('UPDATE hr_support_requests SET status = $1, resolution = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [status, resolution, req.params.id]);
    res.json(toCamel(result.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/hr/handbook', async (_req, res) => {
  try {
    const payload = await hrPayload();
    res.json(payload.handbook);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/handbook/acknowledge', async (req, res) => {
  try {
    const handbook = await query('SELECT id FROM handbook_documents WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1');
    const handbookId = handbook.rows[0].id;
    await query('INSERT INTO handbook_acknowledgements (handbook_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [handbookId, req.body.employeeId]);
    res.status(201).json({ ok: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hr/training/modules', async (req, res) => {
  try {
    const { title, category, lessons = [] } = req.body;
    const course = await query('INSERT INTO training_courses (title, category) VALUES ($1, $2) RETURNING *', [title, category]);
    const courseId = course.rows[0].id;
    for (let index = 0; index < lessons.length; index += 1) {
      await query('INSERT INTO training_lessons (course_id, title, sort_order) VALUES ($1,$2,$3)', [courseId, lessons[index], index + 1]);
    }
    const employees = await query('SELECT id FROM employees');
    for (const employee of employees.rows) {
      await query('INSERT INTO employee_training_assignments (course_id, employee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [courseId, employee.id]);
    }
    res.status(201).json(toCamel(course.rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/hr/training/assignments/:courseId/complete', async (req, res) => {
  try {
    await query('UPDATE employee_training_assignments SET completed_at = NOW() WHERE course_id = $1 AND employee_id = $2', [req.params.courseId, req.body.employeeId]);
    res.json({ ok: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/crm/website-intelligence', async (_req, res) => {
  try {
    res.json(await crmWebsitePayload());
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

app.post('/api/crm/website-intelligence/crawl', async (req, res) => {
  try {
    await initCrmWebsiteSchema();
    const { companyName = 'New prospect', websiteUrl } = req.body;
    if (!websiteUrl) return res.status(400).json({ ok: false, error: 'websiteUrl is required' });
    const domain = String(websiteUrl).replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const profile = await query(
      `INSERT INTO crm_website_profiles (company_name, domain, website_url, industry_guess, business_summary, service_summary, lead_score, seo_score, trust_score, conversion_score, crawl_status, last_crawled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
      [companyName, domain, websiteUrl, 'Pending AI classification', 'Public website crawl queued for CRM lead intelligence.', 'Public services and CTA analysis pending.', 0, 0, 0, 0, 'Public crawl queued']
    );
    const profileId = profile.rows[0].id;
    await query('INSERT INTO crm_website_optimizer_access (website_profile_id) VALUES ($1) ON CONFLICT DO NOTHING', [profileId]);
    await query('INSERT INTO crm_website_recommendations (website_profile_id, recommendation_type, title, description, requires_source_access) VALUES ($1,$2,$3,$4,$5)', [profileId, 'Access', 'Optimizer remains locked until source access is verified.', 'Public analysis and recommendations are allowed, but execution requires repo, CMS, uploaded files, or verified domain ownership.', true]);
    res.status(201).json(await crmWebsiteProfileWithAccess(profileId));
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

app.patch('/api/crm/website-intelligence/:id/access', async (req, res) => {
  try {
    await initCrmWebsiteSchema();
    const profileId = req.params.id;
    const {
      githubRepoConnected = false,
      cmsConnected = false,
      uploadedSiteFiles = false,
      domainOwnershipVerified = false,
      verifiedByUserId = null,
    } = req.body;

    const result = await query(
      `INSERT INTO crm_website_optimizer_access (website_profile_id, github_repo_connected, cms_connected, uploaded_site_files, domain_ownership_verified, verified_by_user_id, verified_at)
       VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN ($2 OR $3 OR $4 OR $5) THEN NOW() ELSE NULL END)
       ON CONFLICT (website_profile_id) DO UPDATE SET
         github_repo_connected = EXCLUDED.github_repo_connected,
         cms_connected = EXCLUDED.cms_connected,
         uploaded_site_files = EXCLUDED.uploaded_site_files,
         domain_ownership_verified = EXCLUDED.domain_ownership_verified,
         verified_by_user_id = EXCLUDED.verified_by_user_id,
         verified_at = EXCLUDED.verified_at,
         updated_at = NOW()
       RETURNING *`,
      [profileId, githubRepoConnected, cmsConnected, uploadedSiteFiles, domainOwnershipVerified, verifiedByUserId]
    );

    const access = toCamel(result.rows[0]);
    res.json({ ok: true, sourceAccess: access, canExecuteOptimizations: canExecuteWebsiteOptimizations(access) });
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

app.post('/api/crm/website-intelligence/:id/optimizer/execute', async (req, res) => {
  try {
    await initCrmWebsiteSchema();
    const profile = await crmWebsiteProfileWithAccess(req.params.id);
    if (!profile) return res.status(404).json({ ok: false, error: 'Website profile not found' });
    if (!profile.canExecuteOptimizations) {
      return res.status(403).json({
        ok: false,
        error: 'Optimizer locked: verified source access is required before execution.',
        allowedWithoutAccess: ['crawl public pages', 'score website', 'generate recommendations', 'generate outreach'],
        requiredAccess: ['connected GitHub repo', 'connected CMS', 'uploaded site files', 'verified domain ownership'],
      });
    }

    const { title = 'Optimizer execution task', description = 'Execution approved by verified source access.' } = req.body;
    const task = await query(
      'INSERT INTO crm_website_recommendations (website_profile_id, recommendation_type, title, description, requires_source_access, execution_status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [profile.id, 'Execution', title, description, true, 'Ready for approval']
    );
    res.status(201).json({ ok: true, task: toCamel(task.rows[0]) });
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Steel Craft portal listening on ${port}`);
});
