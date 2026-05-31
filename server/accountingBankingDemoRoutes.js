import { commitDemoAccountingWorkerMatches, getDemoBankingData, listAccountingWorkerTasks, runDemoAccountingWorker, seedDemoBankingData } from './accountingBankingDemo.js';

export function registerAccountingBankingDemoRoutes(app, requireDatabase, ensureSchema) {
  app.post('/api/accounting/banking/demo/seed', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const banking = await seedDemoBankingData(db);
      await db.query(
        `insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`,
        [req.body?.actor || 'accounting', 'demo_banking_seeded_unmatched', 'accounting_banking', { accountCount: banking.accounts.length, transactionCount: banking.transactions.length, status: 'unmatched' }]
      );
      res.json({ ok: true, banking });
    } catch (error) { next(error); }
  });

  app.get('/api/accounting/banking/demo', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const banking = await getDemoBankingData(db);
      res.json({ ok: true, banking });
    } catch (error) { next(error); }
  });

  app.post('/api/accounting/worker/demo/run', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const result = await runDemoAccountingWorker(db);
      await db.query(
        `insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`,
        [req.body?.actor || 'accounting', 'demo_comptroller_run_pending_commit', 'accounting_worker', { runId: result.run.id, taskCount: result.tasks.length, dailySummary: result.dailySummary }]
      );
      res.json({ ok: true, ...result });
    } catch (error) { next(error); }
  });

  app.post('/api/accounting/worker/demo/commit', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const result = await commitDemoAccountingWorkerMatches(db, { actor: req.body?.actor || 'customer' });
      res.json({ ok: true, ...result });
    } catch (error) { next(error); }
  });

  app.get('/api/accounting/worker/tasks', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const tasks = await listAccountingWorkerTasks(db);
      res.json({ ok: true, tasks });
    } catch (error) { next(error); }
  });
}
