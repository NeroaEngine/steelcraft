(function () {
  var API = '/api/steelcraft/sql-admin/status';
  var ENSURE_API = '/api/steelcraft/sql-admin/ensure';
  var MOUNT_ID = 'steelcraft-admin-sql-control-center';

  function isAdminPath() {
    return /^\/portal\/admin\/?$/.test(location.pathname || '');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function style() {
    return '' +
      '<style data-sql-admin-style="true">' +
      '.scb-sql-admin{display:grid;gap:18px;margin:0 0 18px;width:100%;box-sizing:border-box}' +
      '.scb-sql-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,rgba(159,61,66,.2),rgba(255,255,255,.035));padding:20px;box-shadow:0 18px 48px rgba(0,0,0,.2)}' +
      '.scb-sql-head h2{margin:4px 0;font-size:34px}.scb-sql-head p{margin:0;color:var(--muted);max-width:850px}.scb-sql-pill{border-radius:999px;background:var(--button);color:var(--button-text);font-weight:950;padding:10px 14px;white-space:nowrap}' +
      '.scb-sql-actions{display:flex;gap:10px;flex-wrap:wrap}.scb-sql-actions button,.scb-sql-actions a{border:0;border-radius:999px;background:var(--button);color:var(--button-text);font-weight:950;padding:11px 15px;text-decoration:none;cursor:pointer}' +
      '.scb-sql-actions button.secondary,.scb-sql-actions a.secondary{border:1px solid var(--line);background:rgba(255,255,255,.055);color:var(--text)}' +
      '.scb-sql-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.scb-sql-metric{border:1px solid var(--line);border-radius:18px;background:var(--card);padding:16px}.scb-sql-metric strong{display:block;font-size:28px}.scb-sql-metric span{display:block;color:var(--muted);font-weight:800;margin-top:4px}' +
      '.scb-sql-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.scb-sql-row{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.035);padding:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.scb-sql-row strong{display:block}.scb-sql-row small{display:block;color:var(--muted);margin-top:2px}.scb-sql-count{font-size:20px;font-weight:950}.scb-sql-ok{color:#7dffad}.scb-sql-missing{color:#ff9d9d}.scb-sql-error{border:1px solid rgba(255,90,90,.45);border-radius:18px;background:rgba(180,30,30,.18);padding:14px}' +
      '@media(max-width:900px){.scb-sql-head{display:grid}.scb-sql-metrics,.scb-sql-grid{grid-template-columns:1fr}}' +
      '</style>';
  }

  function countFilledTables(tables) {
    return (tables || []).filter(function (row) { return Number(row.rowCount || 0) > 0; }).length;
  }

  function renderLoading(root) {
    root.innerHTML = style() + '<section class="scb-sql-admin"><div class="scb-sql-head"><div><p class="eyebrow">Admin SQL Control Center</p><h2>Checking Steel Craft SQL tables...</h2><p>Reading the live PostgreSQL schema for the 14 business boards.</p></div><div class="scb-sql-pill">Loading</div></div></section>';
  }

  function renderError(root, message) {
    root.innerHTML = style() + '<section class="scb-sql-admin"><div class="scb-sql-error"><strong>SQL Control Center could not load.</strong><p>' + escapeHtml(message) + '</p></div></section>';
  }

  function render(root, data) {
    var tables = data.tables || [];
    var complete = Number(data.existingCount || 0) + '/' + Number(data.expectedCount || 14);
    var missing = data.missing || [];
    root.innerHTML = style() +
      '<section class="scb-sql-admin">' +
        '<div class="scb-sql-head">' +
          '<div><p class="eyebrow">Admin SQL Control Center</p><h2>Steel Craft SQL Boards</h2><p>This is now reading the live database. These are the 14 business boards that replace browser-only storage for CRM, Sales, Projects, Imports, Audit, Working Board, Estimate Sheet, and Quotation.</p></div>' +
          '<div class="scb-sql-pill">' + escapeHtml(complete) + ' tables</div>' +
        '</div>' +
        '<div class="scb-sql-actions">' +
          '<button type="button" data-scb-sql-refresh>Refresh SQL Counts</button>' +
          '<button type="button" class="secondary" data-scb-sql-ensure>Ensure 14 Tables</button>' +
          '<a class="secondary" href="/portal/contacts">Open CRM</a>' +
          '<a class="secondary" href="/portal/accounting">Open Accounting</a>' +
          '<a class="secondary" href="/portal/contacts/sales-pipeline">Open Sales Pipeline</a>' +
        '</div>' +
        '<div class="scb-sql-metrics">' +
          '<div class="scb-sql-metric"><strong>' + escapeHtml(complete) + '</strong><span>Business tables present</span></div>' +
          '<div class="scb-sql-metric"><strong>' + escapeHtml(countFilledTables(tables)) + '</strong><span>Tables with rows</span></div>' +
          '<div class="scb-sql-metric"><strong>' + escapeHtml(missing.length) + '</strong><span>Missing tables</span></div>' +
          '<div class="scb-sql-metric"><strong>' + escapeHtml(data.tenantId || 'steelcraft') + '</strong><span>Tenant key</span></div>' +
        '</div>' +
        (missing.length ? '<div class="scb-sql-error"><strong>Missing tables:</strong><p>' + escapeHtml(missing.join(', ')) + '</p></div>' : '') +
        '<div class="scb-sql-grid">' + tables.map(function (table) {
          return '<div class="scb-sql-row">' +
            '<div><strong>' + escapeHtml(table.label || table.tableName) + '</strong><small>' + escapeHtml(table.tableName) + '</small></div>' +
            '<div class="scb-sql-count ' + (table.exists ? 'scb-sql-ok' : 'scb-sql-missing') + '">' + (table.exists ? escapeHtml(table.rowCount || 0) : 'Missing') + '</div>' +
          '</div>';
        }).join('') + '</div>' +
      '</section>';

    var refresh = root.querySelector('[data-scb-sql-refresh]');
    var ensure = root.querySelector('[data-scb-sql-ensure]');
    if (refresh) refresh.addEventListener('click', load);
    if (ensure) ensure.addEventListener('click', ensureTables);
  }

  function mountRoot() {
    if (!isAdminPath()) return null;
    var workspace = document.querySelector('.workspace');
    if (!workspace) return null;
    var root = document.getElementById(MOUNT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = MOUNT_ID;
      workspace.insertBefore(root, workspace.firstChild);
    }
    return root;
  }

  async function load() {
    var root = mountRoot();
    if (!root) return;
    renderLoading(root);
    try {
      var response = await fetch(API, { headers: { Accept: 'application/json' } });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'SQL status failed.');
      render(root, data);
    } catch (error) {
      renderError(root, error.message || String(error));
    }
  }

  async function ensureTables() {
    var root = mountRoot();
    if (!root) return;
    renderLoading(root);
    try {
      var response = await fetch(ENSURE_API, { method: 'POST', headers: { Accept: 'application/json' } });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'SQL ensure failed.');
      render(root, data);
    } catch (error) {
      renderError(root, error.message || String(error));
    }
  }

  var lastPath = '';
  function tick() {
    if (!isAdminPath()) return;
    var root = mountRoot();
    if (!root) return;
    if (lastPath !== location.pathname || !root.getAttribute('data-loaded')) {
      lastPath = location.pathname;
      root.setAttribute('data-loaded', 'true');
      load();
    }
  }

  window.addEventListener('popstate', function () { setTimeout(tick, 50); });
  window.addEventListener('load', function () { setTimeout(tick, 250); });
  setInterval(tick, 1000);
  setTimeout(tick, 300);
}());
