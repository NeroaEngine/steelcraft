(function () {
  function money(value) {
    return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  function isBankingRoom() {
    var title = document.querySelector('.accounting-room-heading h1');
    return title && title.textContent.trim() === 'Banking + Cards';
  }

  function cardHtml(title, body) {
    return '<article class="feature panel accounting-form-card accounting-demo-card"><h2>' + title + '</h2>' + body + '</article>';
  }

  function renderDemo(data, tasks) {
    var grid = document.querySelector('.accounting-focus-grid');
    if (!grid || !isBankingRoom()) return;
    var old = grid.querySelector('[data-demo-banking="true"]');
    if (old) old.remove();
    var wrap = document.createElement('section');
    wrap.dataset.demoBanking = 'true';
    wrap.className = 'accounting-full-row accounting-demo-banking-grid';

    var accounts = data.accounts || [];
    var transactions = data.transactions || [];
    var taskRows = tasks || [];

    var accountRows = accounts.map(function (account) {
      return '<div class="accounting-table-row"><strong>' + account.account_name + '</strong><span>' + account.institution_name + ' • ' + account.account_subtype + ' • ****' + account.mask + '</span><b>' + money(account.current_balance) + '</b></div>';
    }).join('') || '<div class="accounting-empty">No demo accounts yet.</div>';

    var txRows = transactions.slice(0, 8).map(function (tx) {
      var s = tx.suggested_match || {};
      return '<div class="accounting-table-row"><strong>' + tx.merchant_name + '</strong><span>' + tx.account_name + ' • ' + tx.category + ' • ' + (s.action || 'Review') + '</span><b>' + money(tx.amount) + '</b></div>';
    }).join('') || '<div class="accounting-empty">No demo transactions yet.</div>';

    var workerRows = taskRows.slice(0, 8).map(function (task) {
      return '<div class="accounting-table-row"><strong>' + task.title + '</strong><span>' + task.suggested_action + '</span><b>' + Number(task.confidence || 0).toFixed(0) + '%</b></div>';
    }).join('') || '<div class="accounting-empty">Run the worker to generate review tasks.</div>';

    wrap.innerHTML = cardHtml('Demo bank accounts', '<div class="accounting-table">' + accountRows + '</div>') + cardHtml('Demo transactions', '<div class="accounting-table">' + txRows + '</div>') + cardHtml('Worker review queue', '<div class="accounting-table">' + workerRows + '</div>');
    grid.appendChild(wrap);
  }

  async function loadDemo() {
    var response = await fetch('/api/accounting/banking/demo');
    var json = await response.json();
    var taskResponse = await fetch('/api/accounting/worker/tasks');
    var taskJson = await taskResponse.json().catch(function () { return {}; });
    if (json.ok) renderDemo(json.banking || {}, taskJson.tasks || []);
  }

  async function seedDemo() {
    await fetch('/api/accounting/banking/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'accounting-demo' }) });
    await loadDemo();
  }

  async function runWorker() {
    var response = await fetch('/api/accounting/worker/demo/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'accounting-demo' }) });
    var json = await response.json().catch(function () { return {}; });
    if (json.ok) renderDemo(json.banking || {}, json.tasks || []);
  }

  function addDemoControls() {
    if (!isBankingRoom()) return;
    var worker = document.querySelector('.accounting-ai-worker .accounting-actions-list');
    if (!worker || worker.dataset.demoControls === 'true') return;
    worker.dataset.demoControls = 'true';
    var seed = document.createElement('button');
    seed.type = 'button';
    seed.textContent = 'Load demo bank data';
    seed.addEventListener('click', seedDemo);
    var run = document.createElement('button');
    run.type = 'button';
    run.textContent = 'Run demo worker';
    run.addEventListener('click', runWorker);
    worker.prepend(run);
    worker.prepend(seed);
    loadDemo().catch(function () {});
  }

  function tick() { addDemoControls(); }
  window.addEventListener('load', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
}());
