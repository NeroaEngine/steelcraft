import express from 'express';

const DEFAULT_ALLOWED_EMAIL = 'admin@neroa.io';

function expectedEmail() {
  return String(process.env.STEELCRAFT_PREVIEW_AUTH_EMAIL || DEFAULT_ALLOWED_EMAIL).trim().toLowerCase();
}

function expectedPassword() {
  return String(process.env.STEELCRAFT_PREVIEW_AUTH_PASSWORD || '').trim();
}

function safeUser(email) {
  return {
    email,
    name: email.split('@')[0] || 'Steel Craft Admin',
    role: 'admin',
    temporaryAuth: true,
    issuedAt: new Date().toISOString()
  };
}

function registerSteelcraftPreviewAuthRoutes(app) {
  if (app.__steelcraftPreviewAuthRoutesRegistered) return;
  app.__steelcraftPreviewAuthRoutesRegistered = true;

  app.post('/api/auth/preview-login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    const configuredPassword = expectedPassword();

    if (!configuredPassword) {
      return res.status(503).json({
        ok: false,
        code: 'preview_auth_not_configured',
        message: 'STEELCRAFT_PREVIEW_AUTH_PASSWORD is not configured.'
      });
    }

    if (email !== expectedEmail() || password !== configuredPassword) {
      return res.status(401).json({ ok: false, code: 'invalid_login', message: 'Invalid login.' });
    }

    res.json({ ok: true, user: safeUser(email), redirectTo: '/command-center' });
  });

  app.get('/api/auth/preview-status', (req, res) => {
    res.json({ ok: true, configured: Boolean(expectedPassword()), email: expectedEmail() });
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftPreviewAuthAutoRegister) {
  express.application.listen = function patchedSteelcraftPreviewAuthListen(...args) {
    registerSteelcraftPreviewAuthRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__steelcraftPreviewAuthAutoRegister', { value: true });
}
