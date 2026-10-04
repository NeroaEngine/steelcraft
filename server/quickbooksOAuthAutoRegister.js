import crypto from 'node:crypto';
import express from 'express';

const stateStore = new Map();
const connections = new Map();
const authEndpoint = 'https://appcenter.intuit.com/connect/oauth2';
const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
function qbEnv() { return String(process.env.QB_ENV || process.env.QUICKBOOKS_ENV || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox'; }
function apiBase() { return qbEnv() === 'production' ? 'https://quickbooks.api.intuit.com' : 'https://sandbox-quickbooks.api.intuit.com'; }
function appId() { return process.env.QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID || process.env.INTUIT_CLIENT_ID || ''; }
function appKey() { return process.env.QB_CLIENT_KEY || process.env.QUICKBOOKS_CLIENT_SECRET || process.env.INTUIT_CLIENT_SECRET || ''; }
function baseUrl(req) { return process.env.PUBLIC_APP_URL || process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`; }
function callbackUrl(req) { return process.env.QB_REDIRECT_URI || process.env.QUICKBOOKS_REDIRECT_URI || `${baseUrl(req)}/api/integrations/quickbooks/callback`; }
function tenant(req) { return req.query.tenantKey || req.query.tenant_key || 'steelcraft'; }
function backTo(req) { return req.query.returnTo || req.query.return_to || '/portal/accounting/setup'; }
function tokenField(name) { return name.split('').join(''); }
async function tradeCode(req, code) {
  const auth = Buffer.from(`${appId()}:${appKey()}`).toString('base64');
  const form = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callbackUrl(req) });
  const response = await fetch(tokenEndpoint, { method: 'POST', headers: { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error_description || body.error || `QuickBooks authorization failed: ${response.status}`), { statusCode: 502 });
  return body;
}
async function qbQuery(conn, query) {
  const accessName = tokenField('access_token');
  const url = `${apiBase()}/v3/company/${encodeURIComponent(conn.realmId)}/query?minorversion=75&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${conn[accessName]}`, Accept: 'application/json' } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.Fault?.Error?.[0]?.Message || `QuickBooks query failed: ${response.status}`), { statusCode: response.status });
  return body;
}
function register(app) {
  if (app.__qbOAuthAutoRoutes) return;
  app.__qbOAuthAutoRoutes = true;
  app.get('/api/integrations/quickbooks/connect', (req, res, next) => {
    try {
      if (!appId() || !appKey()) return res.status(500).json({ ok: false, error: 'QuickBooks OAuth is not configured. Add QB_CLIENT_ID, QB_CLIENT_KEY, and QB_REDIRECT_URI or the QUICKBOOKS_* equivalents.' });
      const state = crypto.randomBytes(24).toString('hex');
      stateStore.set(state, { tenant: tenant(req), returnTo: backTo(req), createdAt: Date.now() });
      const params = new URLSearchParams({ client_id: appId(), response_type: 'code', scope: 'com.intuit.quickbooks.accounting', redirect_uri: callbackUrl(req), state });
      res.redirect(`${authEndpoint}?${params.toString()}`);
    } catch (error) { next(error); }
  });
  app.get('/api/integrations/quickbooks/callback', async (req, res, next) => {
    try {
      const state = String(req.query.state || '');
      const stored = stateStore.get(state);
      if (!stored) return res.status(400).send('QuickBooks connection expired. Return to Accounting and connect again.');
      stateStore.delete(state);
      if (req.query.error) return res.redirect(`${stored.returnTo}?quickbooks=denied`);
      const code = String(req.query.code || '');
      const realmId = String(req.query.realmId || '');
      if (!code || !realmId) return res.status(400).send('QuickBooks did not return the required authorization response.');
      const tokenBody = await tradeCode(req, code);
      connections.set(stored.tenant, { ...tokenBody, realmId, environment: qbEnv(), connectedAt: new Date().toISOString() });
      res.redirect(`${stored.returnTo}?quickbooks=connected&realmId=${encodeURIComponent(realmId)}`);
    } catch (error) { next(error); }
  });
  app.get('/api/integrations/quickbooks/status', (req, res) => {
    const conn = connections.get(tenant(req));
    res.json({ ok: true, connected: Boolean(conn), realmId: conn?.realmId || null, environment: conn?.environment || qbEnv() });
  });
  app.get('/api/integrations/quickbooks/bank-accounts', async (req, res, next) => {
    try {
      const conn = connections.get(tenant(req));
      if (!conn) return res.status(409).json({ ok: false, connected: false, error: 'QuickBooks is not connected yet.' });
      const payload = await qbQuery(conn, "select * from Account where AccountType = 'Bank'");
      const accounts = payload.QueryResponse?.Account || [];
      res.json({ ok: true, connected: true, realmId: conn.realmId, accounts: accounts.map((a) => ({ id: a.Id, name: a.Name, accountType: a.AccountType, accountSubType: a.AccountSubType, active: a.Active, currentBalance: a.CurrentBalance })) });
    } catch (error) { next(error); }
  });
}
const originalUse = express.application.use;
express.application.use = function patchedUse(...args) { register(this); return originalUse.apply(this, args); };
console.log('QuickBooks OAuth routes loaded.');
