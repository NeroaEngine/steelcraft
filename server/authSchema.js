import crypto from 'node:crypto';

const ITERATIONS = 120000;
const KEYLEN = 64;
const DIGEST = 'sha512';

function getBootstrapPassword() {
  return process.env.AUTH_BOOTSTRAP_PASSWORD || process.env.NEROA_AUTH_BOOTSTRAP_PASSWORD || process.env.STEELCRAFT_AUTH_BOOTSTRAP_PASSWORD || process.env.ERP_BOOTSTRAP_PASSWORD || null;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { salt, hash };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  const actual = Buffer.from(hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export async function ensureAuthSchema(db) {
  await db.query(`
    create table if not exists erp_users (
      id bigserial primary key,
      email text not null unique,
      full_name text not null,
      role text not null check (role in ('developer','admin','accounting','employee','vendor','customer')),
      language text not null default 'en',
      status text not null default 'active' check (status in ('active','disabled','pending')),
      password_hash text,
      password_salt text,
      must_change_password boolean not null default true,
      last_login_at timestamptz,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists erp_password_reset_tokens (
      id bigserial primary key,
      user_id bigint references erp_users(id) on delete cascade,
      email text not null,
      token_hash text not null unique,
      status text not null default 'active' check (status in ('active','used','expired')),
      expires_at timestamptz not null,
      used_at timestamptz,
      requested_ip text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);
}

export async function seedAuthUsers(db) {
  await ensureAuthSchema(db);
  const bootstrapPassword = getBootstrapPassword();
  const credentials = bootstrapPassword ? hashPassword(bootstrapPassword) : { salt: null, hash: null };
  const users = [
    { email: 'seth@steelcraftbuilders.com', fullName: 'Seth Mcbride', role: 'admin', language: 'en' },
    { email: 'admin@neroa.io', fullName: 'Neroa Developer', role: 'developer', language: 'en' }
  ];

  for (const user of users) {
    await db.query(
      `insert into erp_users (email, full_name, role, language, status, password_hash, password_salt, must_change_password, raw)
       values ($1,$2,$3,$4,'active',$5,$6,$7,$8)
       on conflict (email) do update set
         full_name = excluded.full_name,
         role = excluded.role,
         language = coalesce(erp_users.language, excluded.language),
         status = 'active',
         password_hash = case when $9::boolean then excluded.password_hash else erp_users.password_hash end,
         password_salt = case when $9::boolean then excluded.password_salt else erp_users.password_salt end,
         must_change_password = case when $9::boolean then true else erp_users.must_change_password end,
         updated_at = now()`,
      [user.email, user.fullName, user.role, user.language, credentials.hash, credentials.salt, Boolean(bootstrapPassword), user, Boolean(bootstrapPassword)]
    );
  }
}

export async function listAuthUsers(db) {
  await ensureAuthSchema(db);
  const result = await db.query(`
    select id, email, full_name, role, language, status, must_change_password, last_login_at, created_at, updated_at
    from erp_users
    order by role, lower(full_name)
  `);
  return result.rows;
}

export async function updateUserLanguage(db, userId, language) {
  await ensureAuthSchema(db);
  const result = await db.query(
    `update erp_users set language = $1, updated_at = now() where id = $2 returning id, email, full_name, role, language, status`,
    [language || 'en', userId]
  );
  return result.rows[0] || null;
}

export async function requestPasswordReset(db, email, requestedIp = null) {
  await ensureAuthSchema(db);
  const userResult = await db.query(`select id, email, full_name, role, status from erp_users where lower(email) = lower($1) and status = 'active'`, [email || '']);
  const user = userResult.rows[0] || null;
  if (!user) return { sent: false, user: null, resetUrl: null, token: null };

  await db.query(`update erp_password_reset_tokens set status = 'expired' where user_id = $1 and status = 'active'`, [user.id]);
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await db.query(
    `insert into erp_password_reset_tokens (user_id, email, token_hash, expires_at, requested_ip, raw) values ($1,$2,$3,$4,$5,$6)`,
    [user.id, user.email, tokenHash, expiresAt, requestedIp, { requestedFrom: 'login_forgot_password' }]
  );
  const baseUrl = process.env.PUBLIC_APP_URL || process.env.APP_URL || process.env.DIGITALOCEAN_APP_URL || 'https://stingray-app-npaac.ondigitalocean.app';
  return { sent: true, user, token, resetUrl: `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}` };
}

export async function resetPasswordWithToken(db, token, password) {
  await ensureAuthSchema(db);
  if (!token || !password || password.length < 8) return null;
  const tokenHash = hashToken(token);
  const result = await db.query(
    `select prt.*, eu.email, eu.full_name, eu.role
     from erp_password_reset_tokens prt
     join erp_users eu on eu.id = prt.user_id
     where prt.token_hash = $1 and prt.status = 'active' and prt.expires_at > now()
     limit 1`,
    [tokenHash]
  );
  const reset = result.rows[0];
  if (!reset) return null;
  const credentials = hashPassword(password);
  await db.query(`update erp_users set password_hash = $1, password_salt = $2, must_change_password = false, updated_at = now() where id = $3`, [credentials.hash, credentials.salt, reset.user_id]);
  await db.query(`update erp_password_reset_tokens set status = 'used', used_at = now() where id = $1`, [reset.id]);
  return { id: reset.user_id, email: reset.email, name: reset.full_name, role: reset.role };
}

export async function authenticateUser(db, email, password) {
  await ensureAuthSchema(db);
  const result = await db.query(`select * from erp_users where lower(email) = lower($1) and status = 'active'`, [email]);
  const user = result.rows[0];
  if (!user) return null;

  const bootstrapPassword = getBootstrapPassword();
  if (!user.password_hash || !user.password_salt) {
    if (!bootstrapPassword || password !== bootstrapPassword) return null;
  } else if (!verifyPassword(password, user.password_salt, user.password_hash)) {
    return null;
  }

  await db.query(`update erp_users set last_login_at = now(), updated_at = now() where id = $1`, [user.id]);
  return {
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role,
    language: user.language,
    status: user.status,
    mustChangePassword: user.must_change_password
  };
}
