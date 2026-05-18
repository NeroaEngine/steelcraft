(function () {
  if (window.__neroaSafeRuntimeMounted) return;
  window.__neroaSafeRuntimeMounted = true;

  var state = { open: false, tab: 'connect', lastComptroller: null };

  function money(value) {
    return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (html) node.innerHTML = html;
    return node;
  }

  function routeContext() {
    var path = location.pathname || '/';
    var portal = (path.match(/^\/portal\/([^/]+)/) || [])[1] || 'unknown';
    var room = (path.match(/^\/portal\/accounting\/?([^/]*)/) || [])[1] || (portal === 'accounting' ? 'today' : portal);
    return { currentPath: path, currentPortal: portal, currentRoom: room, linked_entity_type: portal, linked_entity_id: room };
  }

  function renderMessages(messages) {
    if (!messages || !messages.length) {
      return '<div class="neroa-safe-message"><strong>Neroa</strong><span>Hi, I am Neroa. How may I help you?</span></div>';
    }
    return messages.slice(-8).map(function (msg) {
      return '<div class="neroa-safe-message"><strong>' + (msg.sender_type === 'assistant' ? 'Neroa' : 'You') + '</strong><span>' + msg.body + '</span></div>';
    }).join('');
  }

  function renderComptroller(result) {
    var body = document.querySelector('[data-neroa-safe-body]');
    if (!body) return;
    var banking = result && result.banking ? result.banking : {};
    var report = result && result.report ? result.report : {};
    var tasks = result && result.tasks ? result.tasks : [];
    var transactions = banking.transactions || [];
    var cashIn = transactions.filter(function (tx) { return Number(tx.amount) > 0; }).reduce(function (sum, tx) { return sum + Number(tx.amount || 0); }, 0);
    var cashOut = transactions.filter(function (tx) { return Number(tx.amount) < 0; }).reduce(function (sum, tx) { return sum + Math.abs(Number(tx.amount || 0)); }, 0);
    var rows = tasks.slice(0, 7).map(function (task) {
      var raw = task.raw || {};
      var match = raw.match || (raw.transaction && raw.transaction.suggested_match) || {};
      var matchedTo = raw.matchedTo || match.matchedTo || match.ledgerAccount || 'No safe match';
      var proof = raw.proofAnchor || match.proofAnchor || 'proof pending';
      return '<div class="neroa-safe-card"><strong>' + task.title + '</strong><span>' + (task.suggested_action || 'Review match') + '</span><span>Matched to: <b>' + matchedTo + '</b></span><span>Proof: ' + proof + '</span></div>';
    }).join('') || '<div class="neroa-safe-card"><strong>No run yet</strong><span>Run the Comptroller to create the daily approval packet.</span></div>';
    body.innerHTML = '' +
      '<div class="neroa-safe-card"><strong>Daily Comptroller</strong><span>' + (report.brief || 'Neroa Comptroller is ready. Load demo data or run the daily approval packet.') + '</span></div>' +
      '<div class="neroa-safe-actions"><button data-neroa-action="seed">Load bank data</button><button data-neroa-action="run-comptroller">Run Comptroller</button></div>' +
      '<div class="neroa-safe-card"><strong>Cash in</strong><span>' + money(cashIn) + '</span></div>' +
      '<div class="neroa-safe-card"><strong>Cash out</strong><span>' + money(cashOut) + '</span></div>' +
      '<div class="neroa-safe-card"><strong>Matched</strong><span>' + (report.matched_count || 0) + ' transactions · ' + Number(report.average_confidence || 0).toFixed(0) + '% confidence</span></div>' +
      rows;
  }

  function renderConnect(messages) {
    var body = document.querySelector('[data-neroa-safe-body]');
    if (!body) return;
    body.innerHTML = renderMessages(messages);
  }

  function setStatus(text) {
    var status = document.querySelector('[data-neroa-safe-status]');
    if (status) status.textContent = text;
  }

  function renderShell() {
    var existing = document.querySelector('[data-neroa-safe-root]');
    if (existing) existing.remove();
    var root = el('div', { 'data-neroa-safe-root': 'true' });
    var launcher = el('button', { class: 'neroa-safe-launcher', type: 'button' }, '<span></span>Neroa Connect');
    var panel = el('section', { class: 'neroa-safe-panel', 'data-neroa-safe-panel': 'true' });
    panel.innerHTML = '' +
      '<div class="neroa-safe-head"><div><h2>Neroa Connect</h2><p>Hi, I am Neroa. I route setup, Comptroller approvals, messages, help, and proof-ready actions.</p></div><button class="neroa-safe-close" type="button" data-neroa-action="close">×</button></div>' +
      '<div class="neroa-safe-tabs"><button type="button" data-neroa-tab="connect">Connect</button><button type="button" data-neroa-tab="comptroller" class="inactive">Comptroller</button></div>' +
      '<div class="neroa-safe-status" data-neroa-safe-status>Ready.</div>' +
      '<div class="neroa-safe-body" data-neroa-safe-body></div>' +
      '<form class="neroa-safe-form" data-neroa-safe-form><input name="message" placeholder="Ask Neroa to set up, route, approve, or explain..." autocomplete="off" /><button type="submit">Send</button></form>';
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);
    launcher.addEventListener('click', function () { state.open = true; panel.classList.add('open'); renderActive(); });
    root.addEventListener('click', function (event) {
      var close = event.target.closest('[data-neroa-action="close"]');
      if (close) { state.open = false; panel.classList.remove('open'); return; }
      var tab = event.target.closest('[data-neroa-tab]');
      if (tab) { state.tab = tab.getAttribute('data-neroa-tab'); renderActive(); return; }
      var action = event.target.closest('[data-neroa-action]');
      if (action) {
        var name = action.getAttribute('data-neroa-action');
        if (name === 'seed') seedBankData();
        if (name === 'run-comptroller') runComptroller();
      }
    });
    panel.querySelector('[data-neroa-safe-form]').addEventListener('submit', sendMessage);
    renderActive();
  }

  function renderActive() {
    document.querySelectorAll('[data-neroa-tab]').forEach(function (button) {
      button.classList.toggle('inactive', button.getAttribute('data-neroa-tab') !== state.tab);
    });
    if (state.tab === 'comptroller') renderComptroller(state.lastComptroller || {});
    else renderConnect();
  }

  async function sendMessage(event) {
    event.preventDefault();
    var input = event.currentTarget.querySelector('input[name="message"]');
    var message = input.value.trim();
    if (!message) return;
    input.value = '';
    setStatus('Routing through Neroa 1...');
    try {
      var response = await fetch('/api/neroa/connect/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'frontend-user', message: message, context: routeContext() })
      });
      var json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Neroa Connect failed.');
      renderConnect([json.userMessage, json.assistantMessage]);
      setStatus('Route: ' + json.route.intent + ' · ' + json.route.model_route.live_or_batch + ' · proof ' + (json.route.model_route.proof_required ? 'required' : 'audit only'));
    } catch (error) {
      renderConnect([{ sender_type: 'user', body: message }, { sender_type: 'assistant', body: 'I captured the request locally. Backend routing is stabilizing. ' + (error.message || '') }]);
      setStatus('Local fallback active.');
    }
  }

  async function seedBankData() {
    setStatus('Loading Comptroller demo bank data...');
    try {
      var response = await fetch('/api/accounting/banking/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'neroa-connect' }) });
      var json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Seed failed.');
      state.lastComptroller = { banking: json.banking, tasks: [], report: { brief: 'Demo bank data loaded. Run Comptroller to build approval packet.', matched_count: 0, average_confidence: 0 } };
      renderComptroller(state.lastComptroller);
      setStatus('Bank data loaded.');
    } catch (error) { setStatus(error.message || 'Bank data failed.'); }
  }

  async function runComptroller() {
    setStatus('Running Neroa Comptroller...');
    try {
      var response = await fetch('/api/accounting/worker/demo/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'neroa-connect' }) });
      var json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Comptroller failed.');
      state.lastComptroller = json;
      renderComptroller(json);
      setStatus('Comptroller packet ready for owner approval.');
    } catch (error) { setStatus(error.message || 'Comptroller failed.'); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderShell, { once: true });
  else renderShell();
}());
