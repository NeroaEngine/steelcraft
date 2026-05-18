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

  function comptrollerCopy(text) {
    return String(text || '')
      .replace(/Neroa accounting worker/g, 'Neroa Comptroller')
      .replace(/accounting worker/g, 'Comptroller')
      .replace(/The banking worker will/g, 'The Comptroller will')
      .replace(/AI agents prepare the accounting work/g, 'The Comptroller prepares the accounting work')
      .replace(/Run worker review/g, 'Run Comptroller review')
      .replace(/Run demo worker/g, 'Run demo Comptroller')
      .replace(/Open review queue/g, 'Open approval packet')
      .replace(/Approve high-confidence items/g, 'Approve matched items')
      .replace(/Deposit worker/g, 'Deposit Comptroller')
      .replace(/Cash worker/g, 'Cash Comptroller')
      .replace(/AR worker/g, 'AR Comptroller')
      .replace(/AP worker/g, 'AP Comptroller')
      .replace(/Margin worker/g, 'Margin Comptroller')
      .replace(/Coding worker/g, 'Coding Comptroller')
      .replace(/Forecast worker/g, 'Forecast Comptroller')
      .replace(/Ledger worker/g, 'Ledger Comptroller')
      .replace(/Payroll worker/g, 'Payroll Comptroller')
      .replace(/Tax report worker/g, 'Tax Comptroller')
      .replace(/Mapping worker/g, 'Mapping Comptroller')
      .replace(/Report agent/g, 'Report Comptroller')
      .replace(/Cash agent/g, 'Cash Comptroller')
      .replace(/Budget agent/g, 'Budget Comptroller')
      .replace(/Labor agent/g, 'Labor Comptroller')
      .replace(/Integration agent/g, 'Integration Comptroller')
      .replace(/Control worker/g, 'Control Comptroller')
      .replace(/Proof worker/g, 'Proof Comptroller')
      .replace(/Bookkeeper/g, 'Comptroller')
      .replace(/Review queue/g, 'Approval packet')
      .replace(/review queue/g, 'approval packet')
      .replace(/worker/g, 'Comptroller')
      .replace(/Worker/g, 'Comptroller');
  }

  function rebrandComptrollerCards() {
    document.querySelectorAll('.accounting-ai-worker').forEach(function (card) {
      card.classList.add('accounting-comptroller-card');
      card.querySelectorAll('h2, p, button, strong, span, b').forEach(function (node) {
        if (!node.childElementCount && node.textContent) node.textContent = comptrollerCopy(node.textContent);
      });
      var title = card.querySelector('h2');
      if (title) title.textContent = 'Neroa Comptroller';
      var description = card.querySelector('p');
      if (description && /flag risk|approval|posting|Comptroller/.test(description.textContent)) {
        description.textContent = 'The Comptroller runs the accounting control work, matches daily activity, flags risk, prepares the owner brief, and waits for approval before posting.';
      }
    });
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

    var comptrollerRows = taskRows.slice(0, 8).map(function (task) {
      return '<div class="accounting-table-row"><strong>' + task.title + '</strong><span>' + task.suggested_action + '</span><b>' + Number(task.confidence || 0).toFixed(0) + '%</b></div>';
    }).join('') || '<div class="accounting-empty">Run the Comptroller to generate the daily approval packet.</div>';

    wrap.innerHTML = cardHtml('Demo bank accounts', '<div class="accounting-table">' + accountRows + '</div>') + cardHtml('Demo transactions', '<div class="accounting-table">' + txRows + '</div>') + cardHtml('Comptroller approval packet', '<div class="accounting-table">' + comptrollerRows + '</div>');
    grid.appendChild(wrap);
    rebrandComptrollerCards();
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
    rebrandComptrollerCards();
    if (!isBankingRoom()) return;
    var comptroller = document.querySelector('.accounting-ai-worker .accounting-actions-list');
    if (!comptroller || comptroller.dataset.demoControls === 'true') return;
    comptroller.dataset.demoControls = 'true';
    var seed = document.createElement('button');
    seed.type = 'button';
    seed.textContent = 'Load demo bank data';
    seed.addEventListener('click', seedDemo);
    var run = document.createElement('button');
    run.type = 'button';
    run.textContent = 'Run demo Comptroller';
    run.addEventListener('click', runWorker);
    comptroller.prepend(run);
    comptroller.prepend(seed);
    loadDemo().catch(function () {});
  }

  function tick() { addDemoControls(); rebrandComptrollerCards(); }
  window.addEventListener('load', tick);
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
}());
