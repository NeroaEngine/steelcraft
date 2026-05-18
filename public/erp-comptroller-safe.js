(function () {
  if (window.__erpComptrollerPromoted) return;
  window.__erpComptrollerPromoted = true;

  var latestReport = null;

  function money(value) {
    return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  function replaceText(text) {
    return String(text || '')
      .replace(/Neroa accounting worker/g, 'Neroa Comptroller')
      .replace(/AI agents prepare the accounting work, flag risk, and create review items\. The human approves before anything posts\./g, 'The Comptroller controls the daily accounting work inside the ERP: cash, receivables, payables, bank matches, reports, risk, approvals, production efficiency, payroll, fixed costs, and proof-ready posting.')
      .replace(/Neroa reviews receivables, payables, tax, cash, and project risk before the user has to hunt for it\./g, 'The Neroa Comptroller reviews receivables, payables, tax, cash, project risk, payroll, production efficiency, and daily actions before the owner has to hunt for it.')
      .replace(/The banking worker will match deposits, card charges, vendors, projects, and ledger accounts before posting\./g, 'The Neroa Comptroller matches deposits, card charges, vendors, projects, and ledger accounts, then prepares an owner approval packet before posting.')
      .replace(/Report agents watch trends, drill down monthly, explain changes, and flag cash-flow problems before they hit the owner\./g, 'The Neroa Comptroller watches trends, drills down monthly, explains changes, and flags cash-flow problems before they hit the owner.')
      .replace(/Run worker review/g, 'Run Comptroller')
      .replace(/Open review queue/g, 'Open approval packet')
      .replace(/Approve high-confidence items/g, 'Approve matched items')
      .replace(/AR worker/g, 'AR Comptroller')
      .replace(/AP worker/g, 'AP Comptroller')
      .replace(/Cash worker/g, 'Cash Comptroller')
      .replace(/Deposit worker/g, 'Deposit Comptroller')
      .replace(/Bookkeeper/g, 'Comptroller')
      .replace(/Review queue/g, 'Approval packet')
      .replace(/Margin worker/g, 'Margin Comptroller')
      .replace(/Coding worker/g, 'Coding Comptroller')
      .replace(/Forecast worker/g, 'Forecast Comptroller')
      .replace(/Report agent/g, 'Report Comptroller')
      .replace(/Cash agent/g, 'Cash Comptroller')
      .replace(/Budget agent/g, 'Budget Comptroller')
      .replace(/Ledger worker/g, 'Ledger Comptroller')
      .replace(/Audit worker/g, 'Audit Comptroller')
      .replace(/Proof worker/g, 'Proof Comptroller')
      .replace(/Payroll worker/g, 'Payroll Comptroller')
      .replace(/Labor agent/g, 'Labor Comptroller')
      .replace(/Cost worker/g, 'Cost Comptroller')
      .replace(/Integration agent/g, 'Integration Comptroller')
      .replace(/Mapping worker/g, 'Mapping Comptroller')
      .replace(/Control worker/g, 'Control Comptroller')
      .replace(/worker/g, 'Comptroller')
      .replace(/Worker/g, 'Comptroller');
  }

  function promoteCard(card) {
    if (!card || card.dataset.comptrollerPromoted === 'true') return;
    card.dataset.comptrollerPromoted = 'true';
    card.classList.add('erp-comptroller-card');
    var heading = card.querySelector('h2');
    if (heading) heading.textContent = 'Neroa Comptroller';
    card.querySelectorAll('p, button, strong, span, b, small').forEach(function (node) {
      if (!node.children.length && node.textContent) node.textContent = replaceText(node.textContent);
    });
    injectDataPanel(card);
  }

  function metric(label, value, note) {
    return '<div class="accounting-metric-card"><strong>' + label + '</strong><b>' + value + '</b><span>' + (note || '') + '</span></div>';
  }

  function entryRows(entries) {
    return (entries || []).slice(0, 30).map(function (entry) {
      return '<div class="accounting-table-row"><strong>' + entry.id + ' · ' + entry.entry_type + '</strong><span>' + entry.party + ' · ' + entry.ledger_account + ' · ' + entry.status + '<br><small>Proof: ' + entry.proof_anchor + '</small></span><b>' + money(entry.amount) + '</b></div>';
    }).join('') || '<div class="accounting-empty">Load demo data to view entries.</div>';
  }

  function machineRows(rows) {
    return (rows || []).map(function (row) {
      return '<div class="accounting-table-row"><strong>' + row.machineName + '</strong><span>' + row.units.toLocaleString() + ' units × ' + money(row.rate) + '</span><b>' + money(row.productionValue) + '</b></div>';
    }).join('');
  }

  function employeeRows(rows) {
    return (rows || []).slice(0, 17).map(function (row) {
      return '<div class="accounting-table-row"><strong>' + row.name + '</strong><span>' + row.role + ' · ' + row.hours + ' hrs × ' + money(row.hourlyRate) + '</span><b>' + money(row.laborCost) + '</b></div>';
    }).join('');
  }

  function fixedRows(rows) {
    return (rows || []).map(function (row) {
      return '<div class="accounting-table-row"><strong>' + row.name + '</strong><span>Monthly fixed cost</span><b>' + money(row.monthlyAmount) + '</b></div>';
    }).join('');
  }

  function renderReport(panel, report) {
    latestReport = report;
    var summary = report.fixedCostSummary || {};
    var production = report.production || {};
    var labor = report.labor || {};
    var result = report.dailyResult || {};
    panel.innerHTML = '' +
      '<div class="accounting-actions-list"><button type="button" data-comptroller-demo-load="true">Load 225 live-style entries</button><button type="button" data-comptroller-demo-report="true">Refresh daily report</button></div>' +
      '<div class="accounting-card-section"><p class="eyebrow">Daily Comptroller Report</p><h3 style="margin:0 0 10px;font-size:26px;letter-spacing:-.04em;">Production, payroll, fixed cost, and accounting data</h3><p>' + report.comptrollerNarrative + '</p><p><small>Proof path: ' + report.proof.proofPath + '<br>Anchor: ' + report.proof.proofAnchor + '</small></p></div>' +
      '<div class="accounting-metric-grid">' +
        metric('Demo entries', (report.accountingEntries || []).length, 'Invoices, bills, timecards, production batches') +
        metric('Fixed costs', money(summary.monthlyFixedCost), money(summary.dailyFixedCostWorkday) + ' per workday') +
        metric('Production', (production.totalUnits || 0).toLocaleString() + ' units', money(production.productionValue) + ' value') +
        metric('Labor', money(labor.loadedLabor), (labor.employeeCount || 0) + ' employees · ' + (labor.totalHours || 0) + ' hrs') +
        metric('Daily result', money(result.estimatedDailyResult), result.status || 'ready') +
        metric('Break-even', (result.breakEvenUnitsAtAvgRate || 0).toLocaleString() + ' units', 'At average unit value') +
      '</div>' +
      '<div class="accounting-card-section"><h3>Machines</h3><div class="accounting-table">' + machineRows(production.machines) + '</div></div>' +
      '<div class="accounting-card-section"><h3>Payroll crew</h3><div class="accounting-table">' + employeeRows(labor.employees) + '</div></div>' +
      '<div class="accounting-card-section"><h3>Fixed cost breakdown</h3><div class="accounting-table">' + fixedRows(report.fixedCosts) + '</div></div>' +
      '<div class="accounting-card-section"><h3>Live-style accounting entries preview</h3><div class="accounting-table">' + entryRows(report.accountingEntries) + '</div></div>';
  }

  function injectDataPanel(card) {
    if (card.querySelector('[data-comptroller-demo-panel="true"]')) return;
    var panel = document.createElement('div');
    panel.dataset.comptrollerDemoPanel = 'true';
    panel.className = 'accounting-card-section comptroller-demo-data-panel';
    panel.innerHTML = '' +
      '<p class="eyebrow">Comptroller demo data</p>' +
      '<h3 style="margin:0 0 8px;font-size:24px;letter-spacing:-.04em;">Production efficiency + payroll + fixed costs</h3>' +
      '<p>Load the live-style demo data to review how Neroa cleans it into an owner-ready daily report.</p>' +
      '<div class="accounting-actions-list"><button type="button" data-comptroller-demo-load="true">Load 225 live-style entries</button><button type="button" data-comptroller-demo-report="true">Show daily report</button></div>';
    card.appendChild(panel);
  }

  async function loadReport(button) {
    var card = button.closest('.accounting-ai-worker, .erp-comptroller-card');
    var panel = card && card.querySelector('[data-comptroller-demo-panel="true"]');
    if (!panel) return;
    panel.innerHTML = '<div class="accounting-empty">Loading Neroa Comptroller demo data...</div>';
    try {
      var response = await fetch('/api/accounting/comptroller/demo-production/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'erp-comptroller-demo' }) });
      var json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Demo load failed.');
      renderReport(panel, json.report);
    } catch (error) {
      panel.innerHTML = '<div class="accounting-empty">Could not load demo data: ' + (error.message || 'unknown error') + '</div>';
    }
  }

  async function refreshReport(button) {
    var card = button.closest('.accounting-ai-worker, .erp-comptroller-card');
    var panel = card && card.querySelector('[data-comptroller-demo-panel="true"]');
    if (!panel) return;
    if (latestReport) return renderReport(panel, latestReport);
    loadReport(button);
  }

  function promoteAll() {
    document.querySelectorAll('.accounting-ai-worker').forEach(promoteCard);
  }

  function schedulePromote() {
    var ticks = 0;
    promoteAll();
    var timer = window.setInterval(function () {
      promoteAll();
      ticks += 1;
      if (ticks >= 12) window.clearInterval(timer);
    }, 250);
  }

  document.addEventListener('click', function (event) {
    var load = event.target.closest('[data-comptroller-demo-load]');
    if (load) { loadReport(load); return; }
    var report = event.target.closest('[data-comptroller-demo-report]');
    if (report) { refreshReport(report); return; }
    if (event.target && (event.target.closest('.nav-list') || event.target.closest('.accounting-section-nav'))) {
      window.setTimeout(schedulePromote, 120);
    }
  });
  window.addEventListener('load', schedulePromote);
  window.addEventListener('popstate', schedulePromote);
  if (document.readyState !== 'loading') schedulePromote();
}());
