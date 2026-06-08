(function () {
  if (window.__accountingReportsLive) return;
  window.__accountingReportsLive = true;

  var baseRows = [
    ['1000 Cash - Operating', 'cash', 'Bank feed, deposits, fees, and approved payments', '$214,600'],
    ['1100 Accounts Receivable', 'accrual', 'Customer invoices and collections activity', '$184,200'],
    ['1200 Contract Assets / WIP', 'accrual', 'Unbilled work tracked from SOV and job cost', '$91,300'],
    ['2000 Accounts Payable', 'accrual', 'Vendor bills and scheduled payments', '$76,800'],
    ['2100 Retainage Payable', 'accrual', 'Retainage by project and vendor', '$18,600'],
    ['4000 Sales Revenue', 'accrual', 'Billing and SOV entries pending close', '$311,000'],
    ['5000 Cost of Goods Sold', 'accrual', 'PO, bills, and project costs routed here', '$142,700'],
    ['6000 Operating Expenses', 'cash', 'Bank, vendor, payroll, and overhead expenses', '$38,900']
  ];

  var reportData = {
    'General Ledger Detail': baseRows,
    'Trial Balance': [['Debit accounts', 'accrual', 'Cash, AR, WIP, COGS, and operating expense balances', '$671,500'], ['Credit accounts', 'accrual', 'AP, retainage, sales revenue, and equity balances', '$671,500'], ['Variance', 'accrual', 'Trial balance is currently in balance', '$0']],
    'Balance Sheet': [['Assets', 'accrual', 'Cash, AR, WIP, deposits, and equipment', '$490,100'], ['Liabilities', 'accrual', 'AP, retainage, deposits, and accrued costs', '$95,400'], ['Equity', 'accrual', 'Current retained equity snapshot', '$394,700']],
    'Profit and Loss': [['4000 Sales Revenue', 'accrual', 'Sales revenue and progress billing', '$311,000'], ['5000 Cost of Goods Sold', 'accrual', 'PO, bill, material, and project costs', '$142,700'], ['6000 Operating Expenses', 'cash', 'Bank, vendor, payroll, and overhead expenses', '$38,900']],
    'Cash Position': [['1000 Cash - Operating', 'cash', 'Operating cash tied to bank review workflow', '$214,600'], ['Near-term AR', 'cash', 'Customer balances due this week', '$82,400'], ['Scheduled AP', 'cash', 'Approved bills in payment run', '$35,350']],
    'Revenue Forecast': [['4000 Sales Revenue', 'accrual', 'Expected billing from open SOV and invoices this month', '$133,700'], ['1200 Contract Assets / WIP', 'accrual', 'Projected draw and earned revenue timing', '$118,400'], ['At risk revenue', 'accrual', 'Requires approval or customer action', '$24,900']],
    'Expense Forecast': [['2000 Accounts Payable', 'accrual', 'Upcoming approved and pending vendor bills', '$35,350'], ['Open PO commitments', 'accrual', 'Open purchase order exposure', '$126,650'], ['6000 Operating Expenses', 'cash', 'Cash overhead pressure forecast', '$38,900']]
  };

  var accountOptions = [
    ['all', 'All accounts'],
    ['cash', 'Cash basis accounts'],
    ['accrual', 'Accrual basis accounts'],
    ['1000', '1000 Cash - Operating'],
    ['1100', '1100 Accounts Receivable'],
    ['1200', '1200 Contract Assets / WIP'],
    ['2000', '2000 Accounts Payable'],
    ['2100', '2100 Retainage Payable'],
    ['4000', '4000 Sales Revenue'],
    ['5000', '5000 Cost of Goods Sold'],
    ['6000', '6000 Operating Expenses']
  ];
  var categoryOrder = ['Financial Statements', 'Receivables & Collections', 'Payables & Vendors', 'Project & Job Cost', 'Banking & Comptroller', 'Tax, Compliance & Audit', 'Forecasting & Close'];

  function currentReportPage() { return location.pathname.indexOf('/portal/accounting/reports') !== -1; }
  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function today() { return new Date().toISOString().slice(0, 10); }

  function categoryFor(title) {
    if (/General Ledger|Trial Balance|Balance Sheet|Profit and Loss|Cash Position|Gross Margin/.test(title)) return 'Financial Statements';
    if (/AR|Collections|Customer Statement|Invoice Register|Credit Memo|Refund|Deposit/.test(title)) return 'Receivables & Collections';
    if (/AP|Vendor|Bill Register|Payment Run|1099/.test(title)) return 'Payables & Vendors';
    if (/Purchase Order|PO |Schedule of Values|Retainage|Change Order|Project|Job Cost|Committed|Unbilled|Underbilling|Overbilling|Lien Waiver/.test(title)) return 'Project & Job Cost';
    if (/Bank|Unmatched|AI Match|Posting/.test(title)) return 'Banking & Comptroller';
    if (/Tax|Insurance|Audit|Vault|Evidence|Accounting Exceptions/.test(title)) return 'Tax, Compliance & Audit';
    return 'Forecasting & Close';
  }

  function normalizedRows(title, basis) {
    if (reportData[title]) return reportData[title];
    if (/Aging|Collections/.test(title)) return [['1100 Accounts Receivable', 'accrual', 'Open balances inside selected period', '$70,300'], ['Collections watch', basis, 'Follow-up needed', '$31,500'], ['Priority', basis, 'Escalation or owner review', '$82,400']];
    if (/Purchase Order|PO /.test(title)) return [['Open PO commitments', 'accrual', 'Approved and tied to project cost code', '$126,650'], ['PO-22019', 'accrual', 'Vendor confirmation needed', 'Pending'], ['PO-22020', 'accrual', 'Receiving not complete', 'Review']];
    if (/Audit|Vault|Evidence/.test(title)) return [['Audit evidence', basis, 'Approved packet saved with timestamp', 'Proof'], ['PO approval', basis, 'Approval receipt stored', 'Proof'], ['User action', basis, 'Accounting action captured in audit trail', 'Logged']];
    return [['Generated row 1', basis, title + ' output using ' + basis + ' basis', '$82,400'], ['Generated row 2', basis, 'Filtered by selected account and period', '$31,500'], ['Generated row 3', basis, 'Ready for comptroller review and export', 'Ready']];
  }

  function buildRows(title, basis, account) {
    var rows = normalizedRows(title, basis);
    if (basis === 'cash') rows = rows.filter(function (row) { return row[1] === 'cash' || /cash|deposit|payment|bank/i.test(row.join(' ')); });
    if (basis === 'accrual') rows = rows.filter(function (row) { return row[1] === 'accrual' || /accrual|invoice|AP|AR|WIP|revenue/i.test(row.join(' ')); });
    if (account && account !== 'all' && account !== 'cash' && account !== 'accrual') rows = rows.filter(function (row) { return String(row[0]).indexOf(account) !== -1; });
    if (account === 'cash') rows = rows.filter(function (row) { return row[1] === 'cash'; });
    if (account === 'accrual') rows = rows.filter(function (row) { return row[1] === 'accrual'; });
    return rows.length ? rows : [['No matching account rows', basis, 'No rows match the selected account and basis filters.', '$0']];
  }

  function collectReports(room) {
    var rows = Array.from(room.querySelectorAll('.accounting-table-row')).filter(function (row) { return !row.closest('[data-accounting-report-live-panel="true"]') && !row.closest('[data-accounting-report-browser="true"]'); });
    return rows.map(function (row) {
      var title = row.querySelector('strong')?.textContent?.trim() || '';
      var description = row.querySelector('span')?.textContent?.trim() || '';
      return { title: title, description: description, category: categoryFor(title) };
    }).filter(function (item) { return item.title; });
  }

  function browserHtml(reports) {
    var categoryOptions = categoryOrder.map(function (category) { return '<option value="' + esc(category) + '">' + esc(category) + '</option>'; }).join('');
    var accountSelect = accountOptions.map(function (item) { return '<option value="' + esc(item[0]) + '">' + esc(item[1]) + '</option>'; }).join('');
    var grouped = categoryOrder.map(function (category) {
      var cards = reports.filter(function (report) { return report.category === category; }).map(function (report) {
        return '<button type="button" class="accounting-report-card" data-report-card="true" data-report-title="' + esc(report.title) + '" data-report-category="' + esc(report.category) + '" data-report-description="' + esc(report.description) + '"><strong>' + esc(report.title) + '</strong><span>' + esc(report.description) + '</span><b>Open</b></button>';
      }).join('');
      if (!cards) return '';
      return '<section class="accounting-report-group" data-report-group="' + esc(category) + '"><div class="accounting-report-group-head"><h3>' + esc(category) + '</h3><span>' + reports.filter(function (report) { return report.category === category; }).length + ' reports</span></div><div class="accounting-report-card-grid">' + cards + '</div></section>';
    }).join('');
    return '<div class="accounting-report-browser" data-accounting-report-browser="true"><div class="accounting-report-browser-head"><div><p class="eyebrow">Report library</p><h2>Accounting reports</h2><p>Grouped, searchable reports with run parameters. Pick the report, account, date range, and cash or accrual basis before running.</p></div></div><div class="accounting-report-filters"><label><span>Search reports</span><input data-report-filter="search" placeholder="Search balance sheet, AR, job cost..." /></label><label><span>Category</span><select data-report-filter="category"><option value="all">All categories</option>' + categoryOptions + '</select></label><label><span>Account</span><select data-report-filter="account">' + accountSelect + '</select></label><label><span>From date</span><input type="date" data-report-filter="from" /></label><label><span>To date</span><input type="date" data-report-filter="to" value="' + today() + '" /></label><label><span>Accounting basis</span><select data-report-filter="basis"><option value="accrual">Accrual basis</option><option value="cash">Cash basis</option></select></label></div><div class="accounting-report-groups" data-report-groups="true">' + grouped + '</div></div>';
  }

  function getParams(room) {
    return { from: room.querySelector('[data-report-filter="from"]')?.value || 'period start', to: room.querySelector('[data-report-filter="to"]')?.value || today(), basis: room.querySelector('[data-report-filter="basis"]')?.value || 'accrual', account: room.querySelector('[data-report-filter="account"]')?.value || 'all' };
  }

  function renderRows(rows) {
    return rows.map(function (row) { return '<div class="accounting-table-row accounting-report-result-row"><strong>' + esc(row[0]) + '</strong><span>' + esc(row[2]) + '<br><small>Basis: ' + esc(row[1]) + '</small></span><b>' + esc(row[3]) + '</b></div>'; }).join('');
  }

  function panelHtml(title, description, params) {
    params = params || { from: 'period start', to: today(), basis: 'accrual', account: 'all' };
    var accountSelect = accountOptions.map(function (item) { return '<option value="' + esc(item[0]) + '"' + (params.account === item[0] ? ' selected' : '') + '>' + esc(item[1]) + '</option>'; }).join('');
    return '<div class="accounting-report-live-panel accounting-report-runner" data-accounting-report-live-panel="true" data-report-title="' + esc(title) + '"><div class="accounting-report-runner-head"><button type="button" data-report-back="true">Back to report library</button><p class="eyebrow">Live accounting report</p><h1>' + esc(title) + '</h1><p>' + esc(description || 'Live accounting report generated from current accounting demo data.') + '</p></div><div class="accounting-report-run-params"><label><span>Account</span><select data-run-param="account">' + accountSelect + '</select></label><label><span>From date</span><input type="date" data-run-param="from" value="' + esc(params.from === 'period start' ? '' : params.from) + '" /></label><label><span>To date</span><input type="date" data-run-param="to" value="' + esc(params.to) + '" /></label><label><span>Accounting basis</span><select data-run-param="basis"><option value="accrual"' + (params.basis === 'accrual' ? ' selected' : '') + '>Accrual basis</option><option value="cash"' + (params.basis === 'cash' ? ' selected' : '') + '>Cash basis</option></select></label><label><span>Output</span><select data-run-param="output"><option value="detail">Detail</option><option value="summary">Summary</option><option value="executive">Executive</option></select></label></div><div class="accounting-report-live-actions"><button type="button" data-report-action="run">Run Report</button><button type="button" data-report-action="export">Export Package</button><button type="button" data-report-action="print">Prepare Print View</button><button type="button" data-report-action="schedule">Schedule Delivery</button><button type="button" data-report-action="comptroller">Send to Comptroller</button></div><div class="accounting-report-live-status" data-report-status><span>Status: Ready to run</span><span>Account: ' + esc(params.account) + '</span><span>Basis: ' + esc(params.basis) + '</span><span>Through: ' + esc(params.to) + '</span></div><div class="accounting-report-output" data-report-output><div class="accounting-report-action-note"><strong>Ready</strong> - Select account, date range, and cash/accrual basis, then run the report.</div></div></div>';
  }

  function runAction(panel, action) {
    var title = panel.dataset.reportTitle || 'Accounting report';
    var basis = panel.querySelector('[data-run-param="basis"]')?.value || 'accrual';
    var account = panel.querySelector('[data-run-param="account"]')?.value || 'all';
    var accountText = panel.querySelector('[data-run-param="account"] option:checked')?.textContent || 'All accounts';
    var from = panel.querySelector('[data-run-param="from"]')?.value || 'period start';
    var to = panel.querySelector('[data-run-param="to"]')?.value || today();
    var outputType = panel.querySelector('[data-run-param="output"]')?.value || 'detail';
    var rows = buildRows(title, basis, account);
    var status = panel.querySelector('[data-report-status]');
    var output = panel.querySelector('[data-report-output]');
    var actionCopy = { run: 'Report run completed.', export: 'Export package prepared.', print: 'Print view prepared.', schedule: 'Recurring delivery scheduled.', comptroller: 'Sent to Neroa Comptroller review queue.' }[action] || 'Report run completed.';
    if (status) status.innerHTML = '<span>Last action: ' + esc(action) + '</span><span>Account: ' + esc(accountText) + '</span><span>From: ' + esc(from) + '</span><span>To: ' + esc(to) + '</span><span>Basis: ' + esc(basis) + '</span><span>Output: ' + esc(outputType) + '</span>';
    if (output) output.innerHTML = '<div class="accounting-report-action-note"><strong>' + esc(actionCopy) + '</strong> ' + esc(title) + ' generated for ' + esc(accountText) + ' using ' + esc(basis) + ' basis for ' + esc(from) + ' through ' + esc(to) + '.</div><div class="accounting-table">' + renderRows(rows) + '</div>';
  }

  function applyFilters(browser) {
    var search = (browser.querySelector('[data-report-filter="search"]')?.value || '').toLowerCase();
    var category = browser.querySelector('[data-report-filter="category"]')?.value || 'all';
    browser.querySelectorAll('[data-report-card="true"]').forEach(function (card) {
      var text = (card.dataset.reportTitle + ' ' + card.dataset.reportDescription).toLowerCase();
      var visible = (!search || text.indexOf(search) !== -1) && (category === 'all' || card.dataset.reportCategory === category);
      card.hidden = !visible;
    });
    browser.querySelectorAll('[data-report-group]').forEach(function (group) { group.hidden = !Array.from(group.querySelectorAll('[data-report-card="true"]')).some(function (card) { return !card.hidden; }); });
  }

  function enhanceReports() {
    if (!currentReportPage()) return;
    var room = document.querySelector('.accounting-report-room');
    if (!room || room.querySelector('[data-accounting-report-browser="true"]')) return;
    var reports = collectReports(room);
    if (!reports.length) return;
    var originalCard = room.querySelector('.accounting-form-card');
    if (originalCard) originalCard.remove();
    room.insertAdjacentHTML('beforeend', browserHtml(reports));
  }

  function schedule() { window.setTimeout(enhanceReports, 80); window.setTimeout(enhanceReports, 250); }
  window.addEventListener('load', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('input', function (event) { var browser = event.target.closest('[data-accounting-report-browser="true"]'); if (browser) applyFilters(browser); });
  document.addEventListener('change', function (event) { var browser = event.target.closest('[data-accounting-report-browser="true"]'); if (browser) applyFilters(browser); });
  document.addEventListener('click', function (event) {
    var actionButton = event.target.closest('[data-report-action]');
    if (actionButton) { var panel = actionButton.closest('[data-accounting-report-live-panel="true"]'); if (panel) runAction(panel, actionButton.dataset.reportAction); return; }
    var back = event.target.closest('[data-report-back]');
    if (back) { var existing = document.querySelector('[data-accounting-report-live-panel="true"]'); if (existing) existing.remove(); return; }
    var card = event.target.closest('[data-report-card="true"]');
    if (card) { var room = document.querySelector('.accounting-report-room'); var existingPanel = room.querySelector('[data-accounting-report-live-panel="true"]'); if (existingPanel) existingPanel.remove(); room.insertAdjacentHTML('afterbegin', panelHtml(card.dataset.reportTitle, card.dataset.reportDescription, getParams(room))); room.querySelector('[data-accounting-report-live-panel="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (event.target && (event.target.closest('.accounting-section-nav') || event.target.closest('.nav-list'))) schedule();
  });
  if (document.readyState !== 'loading') schedule();
}());
