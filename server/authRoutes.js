import { authenticateUser, listAuthUsers, requestPasswordReset, resetPasswordWithToken, updateUserLanguage } from './authSchema.js';

export function registerAuthRoutes(app, requireDatabase, ensureSchema, pool) {
  app.post('/api/auth/login', async (req, res, next) => {
    try {
      await ensureSchema();
      const user = await authenticateUser(requireDatabase(), req.body?.email, req.body?.password);
      if (!user) return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      res.json({ ok: true, user });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/forgot-password', async (req, res, next) => {
    try {
      await ensureSchema();
      const result = await requestPasswordReset(requireDatabase(), req.body?.email, req.ip);
      if (result.sent) {
        await pool.query(
          `insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1, $2, $3, $4)`,
          ['system', 'password_reset_requested', 'erp_user', { email: req.body?.email, emailProvider: 'naroa_email_pending' }]
        );
      }
      res.json({ ok: true, message: 'If that email exists, a password reset link will be sent.' });
    } catch (error) { next(error); }
  });

  app.post('/api/auth/reset-password', async (req, res, next) => {
    try {
      await ensureSchema();
      const user = await resetPasswordWithToken(requireDatabase(), req.body?.token, req.body?.password);
      if (!user) return res.status(400).json({ ok: false, error: 'Reset link is invalid, expired, or password is too short.' });
      await pool.query(
        `insert into portal_activity_logs (actor, action, entity_type, entity_id, metadata) values ($1, $2, $3, $4, $5)`,
        [user.email, 'password_reset_completed', 'erp_user', String(user.id), { email: user.email }]
      );
      res.json({ ok: true, user });
    } catch (error) { next(error); }
  });

  app.get('/api/auth/users', async (req, res, next) => {
    try { await ensureSchema(); const users = await listAuthUsers(requireDatabase()); res.json({ ok: true, users }); } catch (error) { next(error); }
  });

  app.patch('/api/auth/users/:id/language', async (req, res, next) => {
    try {
      await ensureSchema();
      const user = await updateUserLanguage(requireDatabase(), req.params.id, req.body?.language || 'en');
      if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
      res.json({ ok: true, user });
    } catch (error) { next(error); }
  });
}
