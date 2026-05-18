(function () {
  function money(value) {
    return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  function roomActive() {
    var title = document.querySelector('.accounting-room-heading h1');
    return title && (title.textContent.trim() === 'Today' || title.textContent.trim() === 'Banking + Cards' || title.textContent.trim() === 'Accounting Setup');
  }

  function getMount() {
    return document.querySelector('.accounting-section-nav');
  }

  function setStatus(text) {
    var box = document.querySelector('[data-comptroller-status="true"]');
    if (box) box.textContent = text;
  }

  function buildPanel() {
    var panel = document.createElement('section');
    panel.className = 'comptroller-runtime-panel';
    panel.dataset.comptrollerRuntime = 'true';
    panel.innerHTML = '' +
      '<p class="eyebrow">Runtime test</p>' +
      '<h2>Neroa Comptroller Assistant</h2>' +
      '<p>Test how the comptroller runs with real users before we harden it. This is the owner-facing daily operator: match bank transactions, build the cash flow report, flag AR risk, and prepare the approval packet.</p>' +
      '<div class="comptroller-user-strip">' +
        '<div class="comptroller-user-card"><strong>Admin / Owner</strong><span>Approves posting, credit holds, daily report rules, and customer actions.</span></div>' +
        '<div class="comptroller-user-card"><strong>Seth / Admin</strong><span>Reviews Steel Craft accounting setup, customers, vendors, bills, and cash reports.</span></div>' +
        '<div class="comptroller-user-card"><strong>Neroa Comptroller</strong><span>Runs the work daily, prepares the brief, and waits for approval before posting.</span></div>' +
      '</div>' +
      '<div class="comptroller-action-row">' +
        '<button type="button" data-comptroller-action="seed">Load test users + bank data</button>' +
        '<button type="button" data-comptroller-action="run">Run daily comptroller</button>' +
        '<button type="button" data-comptroller-action="email">Preview 4 PM email</button>' +
        '<button type="button" data-comptroller-action="approval">Simulate owner approval</button>' +
      '</div>' +
      '<div class="comptroller-runtime-status" data-comptroller-status="true">Ready for runtime test.</div>' +
      '<div class="comptroller-report-grid" data-comptroller-metrics="true">' +
        '<div class="comptroller-report-card"><strong>Cash in</strong><span>Run the test to calculate.</span></div>' +
        '<div class="comptroller-report-card"><strong>Cash out</strong><span>Run the test to calculate.</span></div>' +
        '<div class="comptroller-report-card"><strong>Matched</strong><span>Run the worker.</span></div>' +
        '<div class="comptroller-report-card"><strong>Confidence</strong><span>Run the worker.</span></div>' +
      '</div>' +
      '<div class="comptroller-brief-sheet" data-comptroller-brief="true">' +
        '<h3>Daily Comptroller Brief</h3>' +
        '<span>The brief sheet will show what Neroa did, what needs approval, and what she recommends.</span>' +
      '</div>';
    panel.addEventListener('click', function (event) {
      var button = event.target.closest('[data-comptroller-action]');
      if (!button) return;
      var action = button.getAttribute('data-comptroller-action');
      if (action === 'seed') seedDemo();
      if (action === 'run') runDaily();
      if (action === 'email') previewEmail();
      if (action === 'approval') simulateApproval();
    });
    return panel;
  }

  function renderResult(result) {
    var banking = result.banking || {};
    var transactions = banking.transactions || [];
    var report = result.report || (banking.reports && banking.reports[0]) || {};
    var cashIn = transactions.filter(function (tx) { return Number(tx.amount) > 0; }).reduce(function (sum, tx) { return sum + Number(tx.amount || 0); }, 0);
    var cashOut = transactions.filter(function (tx) { return Number(tx.amount) < 0; }).reduce(function (sum, tx) { return sum + Math.abs(Number(tx.amount || 0)); }, 0);
    var metrics = document.querySelector('[data-comptroller-metrics="true"]');
    if (metrics) {
      metrics.innerHTML = '' +
        '<div class="comptroller-report-card"><strong>Cash in</strong><span>' + money(cashIn) + '</span></div>' +
        '<div class="comptroller-report-card"><strong>Cash out</strong><span>' + money(cashOut) + '</span></div>' +
        '<div class="comptroller-report-card"><strong>Matched</strong><span>' + (report.matched_count || 0) + ' transactions</span></div>' +
        '<div class="comptroller-report-card"><strong>Confidence</strong><span>' + Number(report.average_confidence || 0).toFixed(0) + '% average</span></div>';
    }
    var tasks = result.tasks || [];
    var brief = document.querySelector('[data-comptroller-brief="true"]');
    if (brief) {
      var lines = tasks.slice(0, 8).map(function (task) {
        return '<div class="comptroller-brief-line"><strong>' + task.title + '</strong><span>' + task.suggested_action + '</span><b>' + Number(task.confidence || 0).toFixed(0) + '%</b></div>';
      }).join('');
      brief.innerHTML = '' +
        '<h3>Daily Comptroller Brief</h3>' +
        '<span>' + (report.brief || 'Daily comptroller run complete. Customer approval is required before posting.') + '</span>' +
        '<div class="comptroller-brief-lines">' + lines + '</div>' +
        '<div class="comptroller-approval-row"><button type="button">Approve matched posting</button><button type="button">Review exceptions</button><button type="button">Hold posting</button></div>';
    }
  }

  async function seedDemo() {
    setStatus('Loading demo users, bank accounts, and transactions...');
    var res = await fetch('/api/accounting/banking/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'comptroller-runtime-test' }) });
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Seed failed');
    setStatus('Demo bank data loaded. Now run the daily comptroller.');
    renderResult({ banking: json.banking, tasks: [], report: { matched_count: 0, average_confidence: 0 } });
  }

  async function runDaily() {
    setStatus('Neroa Comptroller is matching transactions and building the daily approval packet...');
    var res = await fetch('/api/accounting/worker/demo/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'comptroller-runtime-test' }) });
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Worker failed');
    setStatus('Daily comptroller run complete. Approval packet is ready.');
    renderResult(json);
  }

  function previewEmail() {
    setStatus('4 PM email preview: Daily Comptroller Report prepared for Admin / Owner. Email delivery will use Neroa notifications when connected.');
  }

  function simulateApproval() {
    setStatus('Owner approval simulated. Next backend step: post approved matches to ledger and write DAG proof.');
  }

  function mountPanel() {
    if (!roomActive()) return;
    if (document.querySelector('[data-comptroller-runtime="true"]')) return;
    var mount = getMount();
    if (!mount || !mount.parentNode) return;
    mount.parentNode.insertBefore(buildPanel(), mount.nextSibling);
  }

  function unmountIfWrongRoom() {
    if (roomActive()) return;
    var panel = document.querySelector('[data-comptroller-runtime="true"]');
    if (panel) panel.remove();
  }

  function tick() {
    unmountIfWrongRoom();
    mountPanel();
  }

  window.addEventListener('load', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
}());
