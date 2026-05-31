import { commitDemoAccountingWorkerMatches, getDemoBankingData, listAccountingWorkerTasks, runDemoAccountingWorker, seedDemoBankingData } from './accountingBankingDemo.js';
import { ensureAccountingAiReceiptSchema, listAccountingAiReceipts, markAccountingAiReceiptsCommitted, recordAccountingAiReceipt } from './accountingAiReceipts.js';
import { approveAccountingExportPackage, buildAccountingExportPackage, getAccountingExportCsv, listAccountingExportPackages } from './accountingExportBridge.js';

export function registerAccountingBankingDemoRoutes(app, requireDatabase, ensureSchema) {
  app.post('/api/accounting/banking/demo/seed', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      await ensureAccountingAiReceiptSchema(db);
      const banking = await seedDemoBankingData(db);
      const receipt = await recordAccountingAiReceipt(db, {
        actor: 'neroacomptroller',
        actionType: 'bank_feed_loaded_unmatched',
        actionLabel: 'Loaded fresh unmatched bank feed entries',
        entityType: 'accounting_bank_transactions',
        entityId: 'demo_batch',
        confidence: 100,
        customerCommitRequired: false,
        metadata: { accountCount: banking.accounts.length, transactionCount: banking.transactions.length, status: 'unmatched' }
      });
      await db.query(
        `insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`,
        [req.body?.actor || 'accounting', 'demo_banking_seeded_unmatched', 'accounting_banking', { accountCount: banking.accounts.length, transactionCount: banking.transactions.length, status: 'unmatched', receiptId: receipt.receipt_id }]
      );
      res.json({ ok: true, banking, receipt });
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
      await ensureAccountingAiReceiptSchema(db);
      const result = await runDemoAccountingWorker(db);
      const receipts = [];
      for (const task of result.tasks || []) {
        const receipt = await recordAccountingAiReceipt(db, {
          actor: 'neroacomptroller',
          actionType: 'comptroller_match_suggested',
          actionLabel: task.title,
          entityType: task.entity_type,
          entityId: task.entity_id,
          confidence: Number(task.confidence || 0),
          customerCommitRequired: true,
          status: 'pending_customer_commit',
          metadata: { taskId: task.id, suggestedAction: task.suggested_action, priority: task.priority, raw: task.raw }
        });
        receipts.push(receipt);
      }
      const summaryReceipt = await recordAccountingAiReceipt(db, {
        actor: 'neroacomptroller',
        actionType: 'daily_comptroller_report_created',
        actionLabel: 'Created daily comptroller report',
        entityType: 'accounting_daily_match_report',
        entityId: String(result.report?.id || ''),
        confidence: Number(result.report?.average_confidence || 0),
        customerCommitRequired: false,
        metadata: { dailySummary: result.dailySummary, taskCount: result.tasks?.length || 0 }
      });
      await db.query(
        `insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`,
        [req.body?.actor || 'accounting', 'demo_comptroller_run_pending_commit', 'accounting_worker', { runId: result.run.id, taskCount: result.tasks.length, dailySummary: result.dailySummary, receiptCount: receipts.length + 1 }]
      );
      res.json({ ok: true, ...result, receipts, summaryReceipt });
    } catch (error) { next(error); }
  });

  app.post('/api/accounting/worker/demo/commit', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const result = await commitDemoAccountingWorkerMatches(db, { actor: req.body?.actor || 'customer' });
      const committedReceipts = await markAccountingAiReceiptsCommitted(db, { actor: req.body?.actor || 'customer', metadata: { committedTransactionCount: result.committedCount } });
      const receipt = await recordAccountingAiReceipt(db, {
        actor: req.body?.actor || 'customer',
        actionType: 'customer_committed_comptroller_matches',
        actionLabel: 'Customer committed AI comptroller matches to books',
        entityType: 'accounting_bank_transactions',
        entityId: 'demo_commit_batch',
        confidence: 100,
        customerCommitRequired: false,
        status: 'committed',
        metadata: { committedCount: result.committedCount, committedReceiptCount: committedReceipts.length }
      });
      res.json({ ok: true, ...result, committedReceipts, receipt });
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

  app.get('/api/accounting/ai/receipts', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const receipts = await listAccountingAiReceipts(db, 250);
      res.json({ ok: true, receipts });
    } catch (error) { next(error); }
  });

  app.get('/api/accounting/comptroller/today', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const banking = await getDemoBankingData(db);
      const tasks = await listAccountingWorkerTasks(db);
      const receipts = await listAccountingAiReceipts(db, 100);
      const latestReport = banking.reports?.[0] || null;
      res.json({ ok: true, banking, tasks, receipts, dailySummary: latestReport?.raw?.dailySummary || null, latestReport });
    } catch (error) { next(error); }
  });

  app.post('/api/accounting/export/prepare', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const pkg = await buildAccountingExportPackage(db, {
        destination: req.body?.destination || 'quickbooks_csv',
        packageType: req.body?.packageType || req.body?.package_type || 'daily_comptroller',
        tenantId: req.body?.tenantId || req.body?.tenant_id || 'steelcraft-demo'
      });
      res.json({ ok: true, package: pkg });
    } catch (error) { next(error); }
  });

  app.get('/api/accounting/export/packages', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const packages = await listAccountingExportPackages(db, req.query?.tenantId || req.query?.tenant_id || 'steelcraft-demo');
      res.json({ ok: true, packages });
    } catch (error) { next(error); }
  });

  app.post('/api/accounting/export/packages/:id/approve', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const pkg = await approveAccountingExportPackage(db, req.params.id, { actor: req.body?.actor || 'customer' });
      if (!pkg) return res.status(404).json({ ok: false, error: 'Export package not found.' });
      res.json({ ok: true, package: pkg });
    } catch (error) { next(error); }
  });

  app.get('/api/accounting/export/packages/:id.csv', async (req, res, next) => {
    try {
      await ensureSchema();
      const db = requireDatabase();
      const result = await getAccountingExportCsv(db, req.params.id);
      if (!result) return res.status(404).send('Export package not found.');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="accounting-export-${req.params.id}.csv"`);
      res.send(result.csv);
    } catch (error) { next(error); }
  });
}
