import crypto from 'node:crypto';

const ITERATIONS = 120000;
const KEYLEN = 64;
const DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { salt, hash };
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
  `);
}

export async function seedAuthUsers(db) {
  await ensureAuthSchema(db);
  const bootstrapPassword = process.env.AUTH_BOOTSTRAP_PASSWORD || process.env.NEROA_AUTH_BOOTSTRAP_PASSWORD || null;
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
         password_hash = coalesce(erp_users.password_hash, excluded.password_hash),
         password_salt = coalesce(erp_users.password_salt, excluded.password_salt),
         updated_at = now()`,
      [user.email, user.fullName, user.role, user.language, credentials.hash, credentials.salt, Boolean(bootstrapPassword), user]
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

export async function authenticateUser(db, email, password) {
  await ensureAuthSchema(db);
  const result = await db.query(`select * from erp_users where lower(email) = lower($1) and status = 'active'`, [email]);
  const user = result.rows[0];
  if (!user) return null;

  const bootstrapPassword = process.env.AUTH_BOOTSTRAP_PASSWORD || process.env.NEROA_AUTH_BOOTSTRAP_PASSWORD || null;
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
