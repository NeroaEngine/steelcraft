export const accountingReportCatalog = [
  {
    category: 'Command Center',
    reports: [
      { key: 'accounting_today', label: 'Accounting Today', purpose: 'Simple owner view: money in, money out, net cash, profit/loss, budget risks, AI recommendation.', endpoint: '/api/accounting/reports/command-center', audience: ['owner', 'admin', 'accountant'] },
      { key: 'daily_comptroller', label: 'Daily Neroa Comptroller Report', purpose: 'What the AI matched, what needs approval, checks to write, AR to collect, AP to review.', endpoint: '/api/accounting/comptroller/today', audience: ['owner', 'admin', 'accountant'] },
      { key: 'cash_position', label: 'Cash Position Snapshot', purpose: 'Current cash status, bank balances, expected cash in/out, runway, warnings.', endpoint: '/api/accounting/reports/cash-flow', audience: ['owner', 'admin'] },
      { key: 'payroll_tax_today', label: 'Payroll / Tax Today', purpose: 'Payroll, employees, PTO, tax liabilities, and employee-cost warnings in one view.', endpoint: '/api/accounting/reports/payroll-tax-command-center', audience: ['owner', 'admin', 'hr', 'accountant'] }
    ]
  },
  {
    category: 'Accounts Receivable',
    reports: [
      { key: 'open_invoices', label: 'Open Invoices', purpose: 'All unpaid and partially paid invoices with customer, due date, balance, and status.', endpoint: '/api/accounting/invoices?status=open', audience: ['owner', 'accountant'] },
      { key: 'ar_aging', label: 'AR Aging', purpose: 'Open receivables grouped current, 1-30, 31-60, 61-90, 90+ days past due.', endpoint: '/api/accounting/reports/ar-aging', audience: ['owner', 'accountant'] },
      { key: 'past_due_receivables', label: 'Past-Due Receivables', purpose: 'Invoices requiring follow-up, with AI-drafted collection email option.', endpoint: '/api/accounting/reports/ar-aging?pastDue=true', audience: ['owner', 'accountant'] },
      { key: 'customer_payment_history', label: 'Customer Payment History', purpose: 'Customer receipts, average days to pay, late-payment patterns, credit risk.', endpoint: '/api/accounting/reports/customer-payment-history', audience: ['accountant'] },
      { key: 'sales_by_customer', label: 'Sales by Customer', purpose: 'Revenue by customer, open AR, margin and concentration risk.', endpoint: '/api/accounting/reports/sales-by-customer', audience: ['owner', 'accountant'] }
    ]
  },
  {
    category: 'Accounts Payable',
    reports: [
      { key: 'open_bills', label: 'Open Bills', purpose: 'All unpaid and partially paid vendor bills with due dates and balances.', endpoint: '/api/accounting/bills?status=open', audience: ['owner', 'accountant'] },
      { key: 'ap_aging', label: 'AP Aging', purpose: 'Open payables grouped current, 1-30, 31-60, 61-90, 90+ days past due.', endpoint: '/api/accounting/reports/ap-aging', audience: ['owner', 'accountant'] },
      { key: 'bills_due', label: 'Bills Due', purpose: 'Bills due today, this week, next 30 days, and past due.', endpoint: '/api/accounting/reports/bills-due', audience: ['owner', 'accountant'] },
      { key: 'checks_to_write', label: 'Checks to Write', purpose: 'Bills approved for check preparation, hold/pay recommendations, cash impact.', endpoint: '/api/accounting/checks', audience: ['owner', 'accountant'] },
      { key: 'vendor_spend', label: 'Vendor Spend', purpose: 'Spend by vendor, category, project, and period with savings opportunities.', endpoint: '/api/accounting/reports/vendor-spend', audience: ['owner', 'accountant'] }
    ]
  },
  {
    category: 'Financial Statements',
    reports: [
      { key: 'profit_loss', label: 'Profit & Loss', purpose: 'Income, COGS, expenses, and net income by period.', endpoint: '/api/accounting/reports/profit-loss', audience: ['owner', 'accountant', 'auditor'] },
      { key: 'balance_sheet', label: 'Balance Sheet', purpose: 'Assets, liabilities, equity, and accounting equation check.', endpoint: '/api/accounting/reports/balance-sheet', audience: ['owner', 'accountant', 'auditor'] },
      { key: 'cash_flow', label: 'Detailed Cash Flow', purpose: 'Actual cash in/out, forecast, runway, AR/AP pressure, and AI cash recommendation.', endpoint: '/api/accounting/reports/cash-flow', audience: ['owner', 'accountant'] },
      { key: 'trial_balance', label: 'Trial Balance', purpose: 'Debit/credit balances by account for period-end review.', endpoint: '/api/accounting/reports/trial-balance', audience: ['accountant', 'auditor'] },
      { key: 'general_ledger', label: 'General Ledger', purpose: 'Journal entry detail by account with source links and trace refs.', endpoint: '/api/accounting/journal', audience: ['accountant', 'auditor'] }
    ]
  },
  {
    category: 'Cash Flow and Forecasting',
    reports: [
      { key: 'daily_cash_flow', label: 'Daily Cash Flow', purpose: 'Daily money in/out, net cash, running cash movement, and warnings.', endpoint: '/api/accounting/reports/cash-flow?view=daily', audience: ['owner'] },
      { key: 'cash_forecast_7_30_90', label: '7/30/90-Day Cash Forecast', purpose: 'Expected cash based on open AR, AP, recurring expenses, payroll, tax liabilities, and budget.', endpoint: '/api/accounting/reports/cash-flow?forecast=90', audience: ['owner'] },
      { key: 'cash_runway', label: 'Cash Runway', purpose: 'How many days the business can operate based on cash, AR, AP, payroll, taxes, and burn.', endpoint: '/api/accounting/reports/cash-flow?view=runway', audience: ['owner'] },
      { key: 'payment_priority', label: 'Payment Priority Report', purpose: 'Which bills to pay, hold, or review based on cash impact and due dates.', endpoint: '/api/accounting/reports/payment-priority', audience: ['owner', 'accountant'] },
      { key: 'collection_priority', label: 'Collection Priority Report', purpose: 'Which customers to follow up with first and what message to send.', endpoint: '/api/accounting/reports/collection-priority', audience: ['owner', 'accountant'] }
    ]
  },
  {
    category: 'Payroll, Employees, PTO, and Taxes',
    reports: [
      { key: 'payroll_summary', label: 'Payroll Summary', purpose: 'Gross pay, net pay, employee taxes, employer taxes, lines by employee, and approval warnings.', endpoint: '/api/accounting/reports/payroll-summary', audience: ['owner', 'hr', 'accountant'] },
      { key: 'payroll_register', label: 'Payroll Register', purpose: 'Employee-level pay period detail: hours, overtime, rate, gross, deductions, taxes, and net.', endpoint: '/api/accounting/reports/payroll-summary?view=register', audience: ['hr', 'accountant'] },
      { key: 'employee_roster', label: 'Employee Roster', purpose: 'All employees, departments, status, role, manager, and contact details.', endpoint: '/api/accounting/reports/employees', audience: ['hr', 'owner'] },
      { key: 'employee_cost', label: 'Employee Cost Report', purpose: 'Wages, loaded labor, payroll taxes, benefits, PTO cost, and department allocation.', endpoint: '/api/accounting/reports/labor?view=employee-cost', audience: ['owner', 'hr', 'accountant'] },
      { key: 'pto_balances', label: 'PTO Balance Report', purpose: 'Beginning, accrued, used, remaining PTO hours, pending requests, and liability estimate.', endpoint: '/api/accounting/reports/pto', audience: ['hr', 'owner', 'accountant'] },
      { key: 'pto_requests', label: 'PTO Requests', purpose: 'Pending, approved, denied, and upcoming PTO requests by employee and manager.', endpoint: '/api/accounting/reports/pto?view=requests', audience: ['hr', 'manager'] },
      { key: 'federal_payroll_taxes', label: 'Federal Payroll Taxes', purpose: 'Federal withholding, Social Security, Medicare, FUTA readiness and liabilities.', endpoint: '/api/accounting/reports/tax-liabilities?jurisdiction=federal', audience: ['accountant', 'owner'] },
      { key: 'state_payroll_taxes', label: 'State Payroll Taxes', purpose: 'State withholding, unemployment, setup status, due dates, and liabilities.', endpoint: '/api/accounting/reports/tax-liabilities?jurisdiction=state', audience: ['accountant', 'owner'] },
      { key: 'local_payroll_taxes', label: 'Local Payroll Taxes', purpose: 'Local wage/payroll taxes, setup status, due dates, and liabilities.', endpoint: '/api/accounting/reports/tax-liabilities?jurisdiction=local', audience: ['accountant', 'owner'] },
      { key: 'tax_liability_calendar', label: 'Tax Liability Calendar', purpose: 'Federal, state, and local payroll tax due dates and deposit reminders.', endpoint: '/api/accounting/reports/tax-liabilities?view=calendar', audience: ['accountant', 'owner'] },
      { key: 'tax_setup_readiness', label: 'Tax Setup Readiness', purpose: 'Flags missing federal, state, local, unemployment, and filing frequency settings.', endpoint: '/api/accounting/reports/tax-liabilities?view=readiness', audience: ['admin', 'accountant'] }
    ]
  },
  {
    category: 'Budgeting and Savings',
    reports: [
      { key: 'budget_vs_actual', label: 'Budget vs Actual', purpose: 'Budget, actual, variance, percent used, risk, and AI recommendation.', endpoint: '/api/accounting/reports/budget', audience: ['owner', 'accountant'] },
      { key: 'ai_savings_plan', label: 'AI Savings Plan', purpose: 'Vendor consolidation, overspend, duplicate expenses, payroll savings, tax timing, and cost reduction suggestions.', endpoint: '/api/accounting/reports/budget?view=savings', audience: ['owner'] },
      { key: 'fixed_cost_breakdown', label: 'Fixed Cost Breakdown', purpose: 'Monthly fixed costs converted to daily cost and cash impact.', endpoint: '/api/accounting/reports/fixed-costs', audience: ['owner'] },
      { key: 'department_budget', label: 'Department / Room Budget', purpose: 'Budget by room: Accounting, Projects, Purchasing, HR, Admin, Sales.', endpoint: '/api/accounting/reports/budget?view=rooms', audience: ['owner', 'admin'] },
      { key: 'payroll_budget', label: 'Payroll Budget', purpose: 'Payroll budget, overtime budget, loaded labor, payroll tax, and variance.', endpoint: '/api/accounting/reports/budget?view=payroll', audience: ['owner', 'hr'] },
      { key: 'spend_guardrail_exceptions', label: 'Spend Guardrail Exceptions', purpose: 'Expenses that break budget, approval, vendor, payroll, tax, or category guardrails.', endpoint: '/api/accounting/reports/spend-exceptions', audience: ['owner', 'admin'] }
    ]
  },
  {
    category: 'Labor and Employee Cost',
    reports: [
      { key: 'labor_cost', label: 'Labor Cost Report', purpose: 'Hours, rates, labor cost, role, employee, and period.', endpoint: '/api/accounting/reports/labor', audience: ['owner', 'hr', 'accountant'] },
      { key: 'labor_vs_production', label: 'Labor vs Production', purpose: 'Labor cost compared to produced value, units, jobs, or revenue.', endpoint: '/api/accounting/reports/labor?view=production', audience: ['owner', 'operations'] },
      { key: 'overtime_risk', label: 'Overtime / Timeclock Exceptions', purpose: 'Missed punches, overtime warnings, auto-lunch edits, and manager approvals.', endpoint: '/api/accounting/reports/labor?view=exceptions', audience: ['hr', 'owner'] },
      { key: 'loaded_labor', label: 'Loaded Labor Cost', purpose: 'Wages plus burden, taxes, benefits, insurance, and overhead allocations.', endpoint: '/api/accounting/reports/labor?view=loaded', audience: ['owner', 'accountant'] }
    ]
  },
  {
    category: 'Job Costing and Projects',
    reports: [
      { key: 'project_profitability', label: 'Project Profitability', purpose: 'Revenue, labor, materials, subcontractors, overhead, and margin by project.', endpoint: '/api/accounting/reports/project-profitability', audience: ['owner', 'project_manager'] },
      { key: 'job_cost_detail', label: 'Job Cost Detail', purpose: 'All costs by job, category, vendor, invoice, bill, and change order.', endpoint: '/api/accounting/reports/job-cost-detail', audience: ['project_manager', 'accountant'] },
      { key: 'change_order_financials', label: 'Change Order Financials', purpose: 'CO revenue/cost impact, pending approvals, and margin changes.', endpoint: '/api/accounting/reports/change-orders', audience: ['owner', 'project_manager'] },
      { key: 'wip', label: 'WIP / Work In Progress', purpose: 'Percent complete, billings, costs, underbilling/overbilling indicators.', endpoint: '/api/accounting/reports/wip', audience: ['owner', 'accountant'] }
    ]
  },
  {
    category: 'Banking and Reconciliation',
    reports: [
      { key: 'unmatched_bank_feed', label: 'Unmatched Bank Feed', purpose: 'Fresh imported transactions waiting for Comptroller matching.', endpoint: '/api/accounting/banking/demo', audience: ['owner', 'accountant'] },
      { key: 'match_confidence', label: 'Comptroller Match Confidence', purpose: '100%, medium, and low-confidence matches awaiting approval.', endpoint: '/api/accounting/worker/tasks', audience: ['owner', 'accountant'] },
      { key: 'reconciliation', label: 'Bank Reconciliation', purpose: 'Cleared, outstanding, difference, and reconciliation status by account.', endpoint: '/api/accounting/reports/reconciliation', audience: ['accountant'] },
      { key: 'suspense_uncategorized', label: 'Suspense / Uncategorized', purpose: 'Transactions that need coding or source documents.', endpoint: '/api/accounting/reports/suspense', audience: ['accountant'] }
    ]
  },
  {
    category: 'Audit and Compliance',
    reports: [
      { key: 'accounting_audit_readiness', label: 'Accounting Audit Readiness', purpose: 'Missing approvals, missing source docs, unmatched entries, period locks, and exceptions.', endpoint: '/api/accounting/reports/audit-readiness', audience: ['admin', 'auditor'] },
      { key: 'payroll_audit_readiness', label: 'Payroll Audit Readiness', purpose: 'Payroll approval, tax setup, PTO liabilities, timeclock exceptions, and employee records.', endpoint: '/api/accounting/reports/payroll-tax-command-center', audience: ['admin', 'auditor', 'hr'] },
      { key: 'ai_action_summary', label: 'AI Action Summary', purpose: 'Summary of AI actions by room, status, approval requirement, and Scan trace availability.', endpoint: '/api/accounting/ai/receipts', audience: ['admin', 'auditor'] },
      { key: 'approval_register', label: 'Approval Register', purpose: 'Who approved checks, bills, journal entries, payroll, PTO, exports, and commits.', endpoint: '/api/accounting/reports/approvals', audience: ['admin', 'auditor'] },
      { key: 'period_close', label: 'Period Close Checklist', purpose: 'Month-end close tasks, locks, adjustments, reconciliation, reports, payroll, taxes, and approvals.', endpoint: '/api/accounting/reports/period-close', audience: ['accountant', 'auditor'] },
      { key: 'export_history', label: 'Export History', purpose: 'QuickBooks/Foundation/CSV packages prepared, approved, and downloaded.', endpoint: '/api/accounting/export/packages', audience: ['accountant', 'auditor'] }
    ]
  }
];

export function getAccountingReportCatalog() {
  return accountingReportCatalog;
}
