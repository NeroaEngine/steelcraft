(function () {
  function money(value) {
    return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  var lastResult = null;

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

  function safeTaskMatch(task) {
    var raw = task.raw || {};
    var match = raw.match || (raw.transaction && raw.transaction.suggested_match) || {};
    return {
      matchedTo: raw.matchedTo || match.matchedTo || match.ledgerAccount || 'No safe match',
      proofAnchor: raw.proofAnchor || match.proofAnchor || 'pending proof anchor',
      action: task.suggested_action || match.action || 'Review transaction coding.',
      status: task.status || '',
      confidence: Number(task.confidence || match.confidence || 0)
    };
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
        '<div class="comptroller-report-card"><strong>Matched</strong><span>Run the Comptroller.</span></div>' +
        '<div class="comptroller-report-card"><strong>Confidence</strong><span>Run the Comptroller.</span></div>' +
      '</div>' +
      '<div class="comptroller-brief-sheet" data-comptroller-brief="true">' +
        '<h3>Daily Comptroller Brief</h3>' +
        '<span>The brief sheet will show what Neroa did, what account each item matched to, what needs approval, and the proof anchor for the chain.</span>' +
      '</div>';
    panel.addEventListener('click', function (event) {
      var button = event.target.closest('[data-comptroller-action]');
      if (button) {
        var action = button.getAttribute('data-comptroller-action');
        if (action === 'seed') seedDemo();
        if (action === 'run') runDaily();
        if (action === 'email') previewEmail();
        if (action === 'approval') simulateApproval();
        return;
      }
      var reviewButton = event.target.closest('[data-comptroller-review-exceptions]');
      if (reviewButton) renderExceptions();
      var approveButton = event.target.closest('[data-comptroller-approve-matched]');
      if (approveButton) simulateApproval();
      var holdButton = event.target.closest('[data-comptroller-hold]');
      if (holdButton) setStatus('Posting held. Comptroller will keep all matches in the approval packet until the owner approves.');
    });
    return panel;
  }

  function renderBrief(tasks, report, mode) {
    var brief = document.querySelector('[data-comptroller-brief="true"]');
    if (!brief) return;
    var filtered = tasks;
    if (mode === 'exceptions') filtered = tasks.filter(function (task) { return safeTaskMatch(task).confidence < 75 || String(task.status || '').indexOf('review') >= 0; });
    var lines = filtered.slice(0, 12).map(function (task) {
      var m = safeTaskMatch(task);
      return '<div class="comptroller-brief-line"><strong>' + task.title + '</strong><span>' + m.action + '<br><small>Matched to: ' + m.matchedTo + '</small><br><small>Proof anchor: ' + m.proofAnchor + '</small></span><b>' + m.confidence.toFixed(0) + '%</b></div>';
    }).join('') || '<div class="comptroller-brief-line"><strong>No exceptions</strong><span>All reviewed items are matched above the approval threshold.</span><b>OK</b></div>';
    brief.innerHTML = '' +
      '<h3>' + (mode === 'exceptions' ? 'Comptroller Exceptions' : 'Daily Comptroller Brief') + '</h3>' +
      '<span>' + (report.brief || 'Daily comptroller run complete. Customer approval is required before posting.') + '</span>' +
      '<div class="comptroller-brief-lines">' + lines + '</div>' +
      '<div class="comptroller-approval-row"><button type="button" data-comptroller-approve-matched="true">Approve matched posting</button><button type="button" data-comptroller-review-exceptions="true">Review exceptions</button><button type="button" data-comptroller-hold="true">Hold posting</button></div>';
  }

  function renderResult(result) {
    lastResult = result;
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
    renderBrief(result.tasks || [], report, 'all');
  }

  function renderExceptions() {
    if (!lastResult) {
      setStatus('Run the daily Comptroller first, then review exceptions.');
      return;
    }
    setStatus('Showing only exceptions and low-confidence matches.');
    renderBrief(lastResult.tasks || [], lastResult.report || {}, 'exceptions');
  }

  async function seedDemo() {
    setStatus('Loading demo users, bank accounts, and transactions...');
    var res = await fetch('/api/accounting/banking/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'comptroller-runtime-test' }) });
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Seed failed');
    setStatus('Demo bank data loaded. Now run the daily comptroller.');
    renderResult({ banking: json.banking, tasks: [], report: { matched_count: 0, average_confidence: 0, brief: 'Demo data loaded. Run the daily Comptroller to create account-level matches and proof anchors.' } });
  }

  async function runDaily() {
    setStatus('Neroa Comptroller is matching transactions and building the daily approval packet...');
    var res = await fetch('/api/accounting/worker/demo/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'comptroller-runtime-test' }) });
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Comptroller failed');
    setStatus('Daily comptroller run complete. Approval packet includes matched account and proof anchor for each item.');
    renderResult(json);
  }

  function previewEmail() {
    if (lastResult) renderResult(lastResult);
    setStatus('4 PM email preview: Daily Comptroller Report now includes matched account, confidence, exception list, and proof anchor for chain accountability.');
  }

  function simulateApproval() {
    setStatus('Owner approval simulated. Next backend step: post approved matches to ledger, write DAG proof, and anchor the match/proof event to NeroaChain/blockchain.');
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
