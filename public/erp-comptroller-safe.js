(function () {
  if (window.__erpComptrollerAiV3) return;
  window.__erpComptrollerAiV3 = true;

  var latestReport = null;
  function money(value) { return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' }); }
  function isAccounting() { return location.pathname.indexOf('/portal/accounting') === 0; }
  function isComptrollerCard(card) {
    var heading = card && card.querySelector('h2');
    return heading && /Neroa Comptroller|Comptroller/i.test(heading.textContent || '');
  }
  function row(a, b, c) { return '<div class="accounting-table-row"><strong>' + a + '</strong><span>' + b + '</span><b>' + c + '</b></div>'; }
  function metric(label, value, note) { return '<div class="accounting-metric-card"><strong>' + label + '</strong><b>' + value + '</b><span>' + (note || '') + '</span></div>'; }
  function rowsFrom(entries) {
    return (entries || []).slice(0, 30).map(function (entry) {
      return row(entry.id + ' · ' + entry.entry_type, entry.party + ' · ' + entry.ledger_account + ' · ' + entry.status + '<br><small>Proof: ' + entry.proof_anchor + '</small>', money(entry.amount));
    }).join('') || '<div class="accounting-empty">No entries loaded.</div>';
  }
  function simpleRows(rows, valueKey, unitText) {
    return (rows || []).map(function (item) {
      var label = item.machineName || item.name || 'Record';
      var detail = item.role ? item.role + ' · ' + item.hours + ' hrs × ' + money(item.hourlyRate) : (unitText || 'Monthly fixed cost');
      var value = item[valueKey] || item.monthlyAmount || item.laborCost || item.productionValue || 0;
      return row(label, detail, money(value));
    }).join('');
  }
  function renderReport(panel, report) {
    latestReport = report;
    var summary = report.fixedCostSummary || {};
    var production = report.production || {};
    var labor = report.labor || {};
    var result = report.dailyResult || {};
    panel.innerHTML = '' +
      '<div class="accounting-actions-list"><button type="button" data-comptroller-demo-load="true">Refresh Comptroller AI</button><button type="button" data-comptroller-demo-report="true">Show Daily Report</button></div>' +
      '<div class="accounting-card-section"><p class="eyebrow">Daily Comptroller AI Report</p><h3 style="margin:0 0 10px;font-size:26px;letter-spacing:-.04em;">Production, payroll, fixed cost, and accounting data</h3><p>' + (report.comptrollerNarrative || 'Neroa Comptroller prepared the daily review packet.') + '</p><p><small>Proof path: ' + (report.proof?.proofPath || 'pending') + '<br>Anchor: ' + (report.proof?.proofAnchor || 'pending') + '</small></p></div>' +
      '<div class="accounting-metric-grid">' +
        metric('Demo entries', (report.accountingEntries || []).length, 'Invoices, bills, timecards, production batches') +
        metric('Fixed costs', money(summary.monthlyFixedCost), money(summary.dailyFixedCostWorkday) + ' per workday') +
        metric('Production', (production.totalUnits || 0).toLocaleString() + ' units', money(production.productionValue) + ' value') +
        metric('Labor', money(labor.loadedLabor), (labor.employeeCount || 0) + ' employees · ' + (labor.totalHours || 0) + ' hrs') +
        metric('Daily result', money(result.estimatedDailyResult), result.status || 'ready') +
      '</div>' +
      '<div class="accounting-card-section"><h3>Machines</h3><div class="accounting-table">' + simpleRows(production.machines, 'productionValue', 'Machine output') + '</div></div>' +
      '<div class="accounting-card-section"><h3>Payroll crew</h3><div class="accounting-table">' + simpleRows(labor.employees, 'laborCost') + '</div></div>' +
      '<div class="accounting-card-section"><h3>Fixed cost breakdown</h3><div class="accounting-table">' + simpleRows(report.fixedCosts, 'monthlyAmount') + '</div></div>' +
      '<div class="accounting-card-section"><h3>Live-style accounting entries preview</h3><div class="accounting-table">' + rowsFrom(report.accountingEntries) + '</div></div>';
  }
  function injectDataPanel(card) {
    if (!card || card.querySelector('[data-comptroller-demo-panel="true"]')) return;
    card.classList.add('erp-comptroller-card', 'accounting-ai-worker');
    card.dataset.comptrollerPromoted = 'true';
    var panel = document.createElement('div');
    panel.dataset.comptrollerDemoPanel = 'true';
    panel.className = 'accounting-card-section comptroller-demo-data-panel';
    panel.innerHTML = '<p class="eyebrow">Comptroller AI</p><h3 style="margin:0 0 8px;font-size:24px;letter-spacing:-.04em;">Controller AI workflow</h3><p>Run the Neroa Comptroller AI review packet for production efficiency, payroll, fixed costs, accounting entries, and owner-ready daily reporting.</p><div class="accounting-actions-list"><button type="button" data-comptroller-demo-load="true">Run Comptroller AI</button><button type="button" data-comptroller-demo-report="true">Show Daily Report</button></div>';
    card.appendChild(panel);
  }
  async function loadReport(button) {
    var card = button.closest('.accounting-ai-worker, .erp-comptroller-card, .accounting-form-card');
    var panel = card && card.querySelector('[data-comptroller-demo-panel="true"]');
    if (!panel) return;
    panel.innerHTML = '<div class="accounting-empty">Loading Neroa Comptroller AI data...</div>';
    try {
      var response = await fetch('/api/accounting/comptroller/demo-production/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'erp-comptroller-demo' }) });
      var json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Demo load failed.');
      renderReport(panel, json.report);
    } catch (error) {
      panel.innerHTML = '<div class="accounting-empty">Could not load Comptroller AI data: ' + (error.message || 'unknown error') + '</div>';
    }
  }
  function refreshReport(button) {
    if (!latestReport) return loadReport(button);
    var card = button.closest('.accounting-ai-worker, .erp-comptroller-card, .accounting-form-card');
    var panel = card && card.querySelector('[data-comptroller-demo-panel="true"]');
    if (panel) renderReport(panel, latestReport);
  }
  function promoteAll() {
    if (!isAccounting()) return;
    document.querySelectorAll('.accounting-form-card, .accounting-ai-worker, .erp-comptroller-card').forEach(function (card) {
      if (card.classList.contains('accounting-ai-worker') || card.classList.contains('erp-comptroller-card') || isComptrollerCard(card)) injectDataPanel(card);
    });
  }
  function schedulePromote() {
    var ticks = 0;
    promoteAll();
    var timer = window.setInterval(function () {
      promoteAll();
      ticks += 1;
      if (ticks >= 16) window.clearInterval(timer);
    }, 250);
  }
  document.addEventListener('click', function (event) {
    var load = event.target.closest('[data-comptroller-demo-load]');
    if (load) { event.preventDefault(); event.stopPropagation(); loadReport(load); return; }
    var report = event.target.closest('[data-comptroller-demo-report]');
    if (report) { event.preventDefault(); event.stopPropagation(); refreshReport(report); return; }
    if (event.target && (event.target.closest('.nav-list') || event.target.closest('.accounting-section-nav'))) window.setTimeout(schedulePromote, 120);
  }, true);
  window.addEventListener('load', schedulePromote);
  window.addEventListener('popstate', schedulePromote);
  new MutationObserver(function () { window.setTimeout(schedulePromote, 120); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') schedulePromote();
}());
