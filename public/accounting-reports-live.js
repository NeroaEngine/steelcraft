(function () {
  if (window.__accountingReportsLiveStable) return;
  window.__accountingReportsLiveStable = true;

  var accounts = [
    ['all', 'All accounts'], ['cash', 'Cash basis accounts'], ['accrual', 'Accrual basis accounts'],
    ['1000', '1000 Cash - Operating'], ['1100', '1100 Accounts Receivable'], ['1200', '1200 Contract Assets / WIP'],
    ['2000', '2000 Accounts Payable'], ['2100', '2100 Retainage Payable'], ['4000', '4000 Sales Revenue'],
    ['5000', '5000 Cost of Goods Sold'], ['6000', '6000 Operating Expenses']
  ];
  var categories = ['Financial Statements', 'Receivables & Collections', 'Payables & Vendors', 'Project & Job Cost', 'Banking & Comptroller', 'Tax, Compliance & Audit', 'Forecasting & Close'];
  var data = {
    'General Ledger Detail': [['1000 Cash - Operating', 'cash', 'Bank feed, deposits, fees, and approved payments', '$214,600'], ['1100 Accounts Receivable', 'accrual', 'Customer invoices and collections activity', '$184,200'], ['1200 Contract Assets / WIP', 'accrual', 'Unbilled work tracked from SOV and job cost', '$91,300'], ['2000 Accounts Payable', 'accrual', 'Vendor bills and scheduled payments', '$76,800'], ['6000 Operating Expenses', 'cash', 'Bank, vendor, payroll, and overhead expenses', '$38,900']],
    'Trial Balance': [['Debit accounts', 'accrual', 'Cash, AR, WIP, COGS, and operating expense balances', '$671,500'], ['Credit accounts', 'accrual', 'AP, retainage, sales revenue, and equity balances', '$671,500'], ['Variance', 'accrual', 'Trial balance is currently in balance', '$0']],
    'Balance Sheet': [['1000 Cash - Operating', 'cash', 'Cash and bank balances', '$214,600'], ['1100 Accounts Receivable', 'accrual', 'Customer invoices not yet collected', '$184,200'], ['1200 Contract Assets / WIP', 'accrual', 'Earned work not yet billed', '$91,300'], ['2000 Accounts Payable', 'accrual', 'Vendor bills and accrued costs', '$76,800']],
    'Profit and Loss': [['4000 Sales Revenue', 'accrual', 'Sales revenue and progress billing', '$311,000'], ['5000 Cost of Goods Sold', 'accrual', 'PO, bill, material, and project costs', '$142,700'], ['6000 Operating Expenses', 'cash', 'Bank, vendor, payroll, and overhead expenses', '$38,900']],
    'Cash Position': [['1000 Cash - Operating', 'cash', 'Operating cash tied to bank review workflow', '$214,600'], ['Customer deposits', 'cash', 'Cash received but not yet fully applied', '$18,000'], ['Scheduled payments', 'cash', 'Approved cash outflow in payment run', '$35,350']],
    'Revenue Forecast': [['4000 Sales Revenue', 'accrual', 'Expected billing from open SOV and invoices this month', '$133,700'], ['1200 Contract Assets / WIP', 'accrual', 'Projected draw and earned revenue timing', '$118,400'], ['At risk revenue', 'accrual', 'Requires approval or customer action', '$24,900']],
    'Expense Forecast': [['2000 Accounts Payable', 'accrual', 'Upcoming approved and pending vendor bills', '$35,350'], ['Open PO commitments', 'accrual', 'Open purchase order exposure', '$126,650'], ['6000 Operating Expenses', 'cash', 'Cash overhead pressure forecast', '$38,900']]
  };

  function esc(v) { return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function onReportsPage() { return location.pathname.indexOf('/portal/accounting/reports') !== -1; }
  function categoryFor(t) {
    if (/General Ledger|Trial Balance|Balance Sheet|Profit and Loss|Cash Position|Gross Margin/.test(t)) return 'Financial Statements';
    if (/AR|Collections|Customer Statement|Invoice|Credit Memo|Refund|Deposit/.test(t)) return 'Receivables & Collections';
    if (/AP|Vendor|Bill|Payment Run|1099/.test(t)) return 'Payables & Vendors';
    if (/Purchase Order|PO |Schedule of Values|Retainage|Change Order|Project|Job Cost|Committed|Unbilled|Underbilling|Overbilling|Lien/.test(t)) return 'Project & Job Cost';
    if (/Bank|Unmatched|AI Match|Posting/.test(t)) return 'Banking & Comptroller';
    if (/Tax|Insurance|Audit|Vault|Evidence|Exception/.test(t)) return 'Tax, Compliance & Audit';
    return 'Forecasting & Close';
  }
  function rowsFor(title, basis, account) {
    var rows = data[title] || [['Generated row 1', basis, title + ' output for selected period', '$82,400'], ['Generated row 2', basis, 'Filtered by selected account and basis', '$31,500'], ['Generated row 3', basis, 'Ready for Comptroller review and export', 'Ready']];
    if (basis === 'cash') rows = rows.filter(function (r) { return r[1] === 'cash' || /cash|bank|deposit|payment/i.test(r.join(' ')); });
    if (basis === 'accrual') rows = rows.filter(function (r) { return r[1] === 'accrual' || /invoice|AP|AR|WIP|revenue|accrued/i.test(r.join(' ')); });
    if (account === 'cash') rows = rows.filter(function (r) { return r[1] === 'cash'; });
    else if (account === 'accrual') rows = rows.filter(function (r) { return r[1] === 'accrual'; });
    else if (account && account !== 'all') rows = rows.filter(function (r) { return String(r[0]).indexOf(account) !== -1; });
    return rows.length ? rows : [['No matching account rows', basis, 'No rows match the selected account and basis filters.', '$0']];
  }
  function installStyle() {
    if (document.getElementById('accounting-reports-stable-style')) return;
    var s = document.createElement('style');
    s.id = 'accounting-reports-stable-style';
    s.textContent = '.accounting-report-room{display:block!important;width:min(100%,1180px)!important;max-width:1180px!important;margin:0 auto!important}.accounting-report-room>.accounting-form-card{display:none!important}.acct-report-shell,.acct-report-runner{display:grid!important;gap:20px!important;width:100%!important;max-width:1180px!important;box-sizing:border-box!important;margin:0 auto 24px!important;padding:28px!important;border:1px solid color-mix(in srgb,var(--line,#343036) 75%,var(--brand-accent,#9f3d42) 25%)!important;border-radius:var(--radius,22px)!important;background:color-mix(in srgb,var(--surface,#141418) 94%,#000 6%)!important}.acct-report-head h2,.acct-report-runner h1{margin:0!important;font-size:clamp(34px,3vw,48px)!important;line-height:1!important;letter-spacing:-.06em!important}.acct-report-head p,.acct-report-runner p{max-width:760px!important;line-height:1.45!important;color:var(--muted,#b7aaa3)!important}.acct-report-filters,.acct-run-params{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:14px!important;align-items:end!important}.acct-report-filters label,.acct-run-params label{display:grid!important;gap:7px!important;margin:0!important;min-width:0!important}.acct-report-filters span,.acct-run-params span{font-size:.72rem!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.08em!important;color:color-mix(in srgb,var(--brand-accent,#9f3d42) 84%,white 16%)!important}.acct-report-filters input,.acct-report-filters select,.acct-run-params input,.acct-run-params select{width:100%!important;min-height:44px!important;border-radius:16px!important;box-sizing:border-box!important;padding:10px 12px!important}.acct-report-groups{display:grid!important;gap:18px!important}.acct-report-group{display:grid!important;gap:12px!important}.acct-report-group-head{display:flex!important;justify-content:space-between!important;align-items:center!important;border-bottom:1px solid color-mix(in srgb,var(--line,#343036) 70%,transparent)!important;padding-bottom:8px!important}.acct-report-group-head h3{margin:0!important;font-size:1.05rem!important}.acct-report-card-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.acct-report-card{display:grid!important;grid-template-columns:minmax(180px,.8fr) minmax(260px,1.5fr) auto!important;gap:14px!important;align-items:center!important;width:100%!important;min-height:66px!important;text-align:left!important;border:1px solid color-mix(in srgb,var(--line,#343036) 78%,transparent)!important;border-radius:16px!important;background:color-mix(in srgb,var(--surface-alt,#1e1e24) 62%,transparent)!important;color:var(--text,#f6f0ea)!important;padding:14px 16px!important;cursor:pointer!important}.acct-report-card:hover{border-color:color-mix(in srgb,var(--brand-accent,#9f3d42) 54%,var(--line,#343036))!important}.acct-report-card span{color:var(--muted,#b7aaa3)!important;line-height:1.35!important}.acct-report-card b{justify-self:end!important;color:color-mix(in srgb,var(--brand-accent,#9f3d42) 86%,white 14%)!important}.acct-actions,.acct-status{display:flex!important;flex-wrap:wrap!important;gap:10px!important}.acct-actions button,.acct-back{border:1px solid color-mix(in srgb,var(--line,#343036) 82%,var(--brand-accent,#9f3d42) 18%)!important;background:color-mix(in srgb,var(--surface-alt,#1e1e24) 78%,#000 22%)!important;color:var(--text,#f6f0ea)!important;border-radius:14px!important;min-height:38px!important;padding:9px 13px!important;font-weight:900!important;cursor:pointer!important}.acct-actions [data-action=run]{background:color-mix(in srgb,var(--brand-accent,#9f3d42) 72%,#000 28%)!important}.acct-status span,.acct-note{border:1px solid color-mix(in srgb,var(--line,#343036) 76%,transparent)!important;border-radius:999px!important;padding:9px 12px!important;color:var(--muted,#b7aaa3)!important;background:color-mix(in srgb,var(--surface-alt,#1e1e24) 62%,transparent)!important}.acct-note{border-radius:16px!important}.acct-output{display:grid!important;gap:10px!important}.acct-result-row small{color:color-mix(in srgb,var(--brand-accent,#9f3d42) 80%,white 20%)!important;font-weight:800!important}@media(max-width:1180px){.acct-report-filters,.acct-run-params{grid-template-columns:repeat(3,minmax(0,1fr))!important}.acct-report-card-grid{grid-template-columns:1fr!important}}@media(max-width:720px){.acct-report-filters,.acct-run-params,.acct-report-card{grid-template-columns:1fr!important}.acct-report-card b{justify-self:start!important}.acct-report-shell,.acct-report-runner{padding:20px!important}}';
    document.head.appendChild(s);
  }
  function getReports() {
    var room = document.querySelector('.accounting-report-room');
    if (!room) return [];
    return Array.from(room.querySelectorAll('.accounting-form-card .accounting-table-row')).map(function (row) {
      var title = row.querySelector('strong')?.textContent?.trim() || '';
      var desc = row.querySelector('span')?.textContent?.trim() || '';
      return { title: title, desc: desc, category: categoryFor(title) };
    }).filter(function (r) { return r.title; });
  }
  function optionHtml(list, selected) { return list.map(function (i) { return '<option value="' + esc(i[0]) + '"' + (selected === i[0] ? ' selected' : '') + '>' + esc(i[1]) + '</option>'; }).join(''); }
  function categoryOptions() { return '<option value="all">All categories</option>' + categories.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join(''); }
  function shellHtml(reports) {
    var groups = categories.map(function (cat) {
      var cards = reports.filter(function (r) { return r.category === cat; }).map(function (r) { return '<button type="button" class="acct-report-card" data-card="true" data-title="' + esc(r.title) + '" data-desc="' + esc(r.desc) + '" data-category="' + esc(r.category) + '"><strong>' + esc(r.title) + '</strong><span>' + esc(r.desc) + '</span><b>Open</b></button>'; }).join('');
      return cards ? '<section class="acct-report-group" data-group="' + esc(cat) + '"><div class="acct-report-group-head"><h3>' + esc(cat) + '</h3><span>' + reports.filter(function (r) { return r.category === cat; }).length + ' reports</span></div><div class="acct-report-card-grid">' + cards + '</div></section>' : '';
    }).join('');
    return '<div class="acct-report-shell" data-report-shell="true"><div class="acct-report-head"><p class="eyebrow">Report library</p><h2>Accounting reports</h2><p>Grouped, searchable reports with run parameters. Pick the report, account, date range, and cash or accrual basis before running.</p></div><div class="acct-report-filters"><label><span>Search reports</span><input data-filter="search" placeholder="Search balance sheet, AR, job cost..." /></label><label><span>Category</span><select data-filter="category">' + categoryOptions() + '</select></label><label><span>Account</span><select data-filter="account">' + optionHtml(accounts, 'all') + '</select></label><label><span>From date</span><input type="date" data-filter="from" /></label><label><span>To date</span><input type="date" data-filter="to" value="' + today() + '" /></label><label><span>Accounting basis</span><select data-filter="basis"><option value="accrual">Accrual basis</option><option value="cash">Cash basis</option></select></label></div><div class="acct-report-groups">' + groups + '</div></div>';
  }
  function params(room) { return { account: room.querySelector('[data-filter=account]')?.value || 'all', basis: room.querySelector('[data-filter=basis]')?.value || 'accrual', from: room.querySelector('[data-filter=from]')?.value || 'period start', to: room.querySelector('[data-filter=to]')?.value || today() }; }
  function runnerHtml(title, desc, p) {
    return '<div class="acct-report-runner" data-runner="true" data-title="' + esc(title) + '"><button type="button" class="acct-back" data-back="true">Back to report library</button><p class="eyebrow">Live accounting report</p><h1>' + esc(title) + '</h1><p>' + esc(desc) + '</p><div class="acct-run-params"><label><span>Account</span><select data-param="account">' + optionHtml(accounts, p.account) + '</select></label><label><span>From date</span><input type="date" data-param="from" value="' + esc(p.from === 'period start' ? '' : p.from) + '" /></label><label><span>To date</span><input type="date" data-param="to" value="' + esc(p.to) + '" /></label><label><span>Accounting basis</span><select data-param="basis"><option value="accrual"' + (p.basis === 'accrual' ? ' selected' : '') + '>Accrual basis</option><option value="cash"' + (p.basis === 'cash' ? ' selected' : '') + '>Cash basis</option></select></label><label><span>Output</span><select data-param="output"><option value="detail">Detail</option><option value="summary">Summary</option><option value="executive">Executive</option></select></label></div><div class="acct-actions"><button type="button" data-action="run">Run Report</button><button type="button" data-action="export">Export Package</button><button type="button" data-action="print">Prepare Print View</button><button type="button" data-action="schedule">Schedule Delivery</button><button type="button" data-action="comptroller">Send to Comptroller</button></div><div class="acct-status" data-status><span>Status: Ready to run</span><span>Basis: ' + esc(p.basis) + '</span><span>Through: ' + esc(p.to) + '</span></div><div class="acct-output" data-output><div class="acct-note"><strong>Ready</strong> - Select account, date range, and cash/accrual basis, then run the report.</div></div></div>';
  }
  function renderRows(rows) { return rows.map(function (r) { return '<div class="accounting-table-row acct-result-row"><strong>' + esc(r[0]) + '</strong><span>' + esc(r[2]) + '<br><small>Basis: ' + esc(r[1]) + '</small></span><b>' + esc(r[3]) + '</b></div>'; }).join(''); }
  function run(panel, action) {
    var title = panel.dataset.title;
    var basis = panel.querySelector('[data-param=basis]').value;
    var account = panel.querySelector('[data-param=account]').value;
    var accountText = panel.querySelector('[data-param=account] option:checked').textContent;
    var from = panel.querySelector('[data-param=from]').value || 'period start';
    var to = panel.querySelector('[data-param=to]').value || today();
    var rows = rowsFor(title, basis, account);
    panel.querySelector('[data-status]').innerHTML = '<span>Last action: ' + esc(action) + '</span><span>Account: ' + esc(accountText) + '</span><span>From: ' + esc(from) + '</span><span>To: ' + esc(to) + '</span><span>Basis: ' + esc(basis) + '</span>';
    panel.querySelector('[data-output]').innerHTML = '<div class="acct-note"><strong>Report run completed.</strong> ' + esc(title) + ' generated for ' + esc(accountText) + ' using ' + esc(basis) + ' basis.</div><div class="accounting-table">' + renderRows(rows) + '</div>';
  }
  function mount() {
    if (!onReportsPage()) return;
    installStyle();
    var room = document.querySelector('.accounting-report-room');
    if (!room || room.querySelector('[data-report-shell=true]')) return;
    var reports = getReports();
    if (!reports.length) return;
    room.insertAdjacentHTML('afterbegin', shellHtml(reports));
  }
  function filter(shell) {
    var search = (shell.querySelector('[data-filter=search]').value || '').toLowerCase();
    var category = shell.querySelector('[data-filter=category]').value;
    shell.querySelectorAll('[data-card=true]').forEach(function (card) { var visible = (!search || (card.dataset.title + ' ' + card.dataset.desc).toLowerCase().indexOf(search) !== -1) && (category === 'all' || card.dataset.category === category); card.hidden = !visible; });
    shell.querySelectorAll('[data-group]').forEach(function (group) { group.hidden = !Array.from(group.querySelectorAll('[data-card=true]')).some(function (card) { return !card.hidden; }); });
  }
  function schedule() { setTimeout(mount, 50); setTimeout(mount, 250); }
  window.addEventListener('load', schedule);
  window.addEventListener('popstate', schedule);
  var observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('input', function (e) { var shell = e.target.closest('[data-report-shell=true]'); if (shell) filter(shell); });
  document.addEventListener('change', function (e) { var shell = e.target.closest('[data-report-shell=true]'); if (shell) filter(shell); });
  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-card=true]');
    if (card) { var room = document.querySelector('.accounting-report-room'); var old = room.querySelector('[data-runner=true]'); if (old) old.remove(); room.insertAdjacentHTML('afterbegin', runnerHtml(card.dataset.title, card.dataset.desc, params(room))); room.querySelector('[data-runner=true]').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    var back = e.target.closest('[data-back=true]'); if (back) { var runner = document.querySelector('[data-runner=true]'); if (runner) runner.remove(); return; }
    var action = e.target.closest('[data-action]'); if (action) { var panel = action.closest('[data-runner=true]'); if (panel) run(panel, action.dataset.action); return; }
  });
  schedule();
}());
