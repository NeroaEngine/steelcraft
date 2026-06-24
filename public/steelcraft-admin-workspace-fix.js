(function () {
  var ROOT_ID = 'scb-admin-rebuilt-root';
  var ENABLED_KEY = 'steelcraft_enabled_portals_v1';
  var ACCESS_KEY = 'steelcraft_admin_portal_access_profiles_v1';
  var portals = [
    ['admin', 'Admin'], ['accounting', 'Accounting'], ['contacts', 'Contacts / CRM'], ['hr', 'HR Portal'], ['vendor', 'Vendor Portal'], ['customer', 'Customer Portal'], ['employee', 'Employee Self-Service'], ['estimating', 'Estimating Portal'], ['projects', 'Projects Portal'], ['planning', 'Planning Portal'], ['purchasing', 'Purchasing Portal']
  ];
  var presets = {
    full: ['admin', 'accounting', 'contacts', 'hr', 'vendor', 'customer', 'employee', 'estimating', 'projects', 'planning', 'purchasing'],
    admin: ['admin', 'accounting', 'contacts', 'estimating', 'projects', 'planning', 'purchasing'],
    accounting: ['accounting', 'contacts', 'employee'],
    employee: ['employee'],
    vendor: ['vendor'],
    customer: ['customer']
  };

  function isAdmin() { return /^\/portal\/admin\/?$/.test(location.pathname || ''); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; }); }
  function read(key, fallback) { try { var value = JSON.parse(localStorage.getItem(key)); return value == null ? fallback : value; } catch (_) { return fallback; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function enabled() { var value = read(ENABLED_KEY, portals.map(function (row) { return row[0]; })); return Array.isArray(value) && value.length ? value : portals.map(function (row) { return row[0]; }); }
  function setEnabled(values) { write(ENABLED_KEY, values); window.dispatchEvent(new CustomEvent('steelcraft-admin-portals-updated', { detail: values })); }
  function go(path) { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }

  function css() {
    if (document.getElementById('scb-admin-rebuild-style')) return;
    var style = document.createElement('style');
    style.id = 'scb-admin-rebuild-style';
    style.textContent = '' +
      'body.scb-admin-rebuilt .workspace > :not(#' + ROOT_ID + '){display:none!important}' +
      'body.scb-admin-rebuilt .neroa-setup-start-button,body.scb-admin-rebuilt [data-setup-root]{display:none!important}' +
      '#'+ROOT_ID+'{display:grid;gap:18px;width:100%;max-width:none;box-sizing:border-box;padding:0 0 42px}' +
      '.scb-admin-top{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);gap:18px}' +
      '.scb-admin-card{border:1px solid var(--line);border-radius:22px;background:var(--card);box-shadow:0 18px 48px rgba(0,0,0,.2);padding:20px;box-sizing:border-box}' +
      '.scb-admin-card h2{font-size:34px;margin:4px 0 8px}.scb-admin-card p{color:var(--muted)}' +
      '.scb-admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.scb-admin-metric{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.035);padding:14px}.scb-admin-metric strong{display:block;font-size:24px}.scb-admin-metric span{color:var(--muted);font-weight:850}' +
      '.scb-admin-form{display:grid;gap:12px}.scb-admin-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.scb-admin-row.three{grid-template-columns:repeat(3,minmax(0,1fr))}.scb-admin-row.four{grid-template-columns:repeat(4,minmax(0,1fr))}' +
      '.scb-admin-form label{display:grid;gap:6px;font-weight:950}.scb-admin-form input,.scb-admin-form select{width:100%;min-height:46px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:var(--input);color:var(--text);padding:10px 12px;font-weight:900;box-sizing:border-box}' +
      '.scb-admin-actions{display:flex;gap:10px;flex-wrap:wrap}.scb-admin-actions button,.scb-admin-actions a{border:0;border-radius:999px;background:var(--button);color:var(--button-text);font-weight:950;padding:11px 15px;text-decoration:none;cursor:pointer}.scb-admin-actions .secondary{border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--text)}' +
      '.scb-admin-table{display:grid;gap:8px}.scb-admin-user{display:grid;grid-template-columns:minmax(0,1fr) 130px 120px 100px;gap:10px;align-items:center;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.03);padding:10px}.scb-admin-user small{display:block;color:var(--muted)}' +
      '.scb-admin-portal-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.scb-admin-portal-pill{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.035);padding:10px;display:flex;align-items:center;justify-content:space-between;gap:8px}.scb-admin-portal-pill b{font-size:12px;color:#7dffad}.scb-admin-portal-pill.off b{color:#ff9d9d}' +
      '@media(max-width:1100px){.scb-admin-top,.scb-admin-row,.scb-admin-row.three,.scb-admin-row.four,.scb-admin-grid,.scb-admin-portal-list{grid-template-columns:1fr}.scb-admin-user{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function shell() {
    if (!isAdmin()) { document.body.classList.remove('scb-admin-rebuilt'); return null; }
    css();
    document.body.classList.add('scb-admin-rebuilt');
    var workspace = document.querySelector('.workspace');
    if (!workspace) return null;
    var root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      workspace.insertBefore(root, workspace.firstChild);
    }
    return root;
  }

  function renderLoading(root) { root.innerHTML = '<section class="scb-admin-card"><p class="eyebrow">Admin Control Center</p><h2>Loading real admin controls...</h2><p>No pop-up. No fake Open / Route / Approve / Proof buttons.</p></section>'; }

  async function getJson(url) { var res = await fetch(url, { headers: { Accept: 'application/json' } }); var data = await res.json(); if (!res.ok || data.ok === false) throw new Error(data.error || url + ' failed'); return data; }
  async function postJson(url, payload) { var res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload || {}) }); var data = await res.json(); if (!res.ok || data.ok === false) throw new Error(data.error || url + ' failed'); return data; }

  function portalControlsHtml(activeEnabled) {
    return '' +
      '<section class="scb-admin-card">' +
      '<p class="eyebrow">Portal controls</p><h2>Open and configure portals</h2><p>The old checkbox wall is replaced with dropdowns. Portal availability is still stored locally for the tenant UI until we wire tenant settings into SQL.</p>' +
      '<div class="scb-admin-form">' +
        '<div class="scb-admin-row three">' +
          '<label>Open portal<select data-admin-open-portal><option value="">Choose portal...</option>' + portals.map(function (row) { return '<option value="' + esc(row[0]) + '">' + esc(row[1]) + '</option>'; }).join('') + '</select></label>' +
          '<label>Portal to configure<select data-admin-config-portal>' + portals.map(function (row) { return '<option value="' + esc(row[0]) + '">' + esc(row[1]) + '</option>'; }).join('') + '</select></label>' +
          '<label>Availability<select data-admin-config-state><option value="on">Enabled</option><option value="off">Disabled</option></select></label>' +
        '</div>' +
        '<div class="scb-admin-actions"><button type="button" data-admin-save-portal>Save portal setting</button><button type="button" class="secondary" data-admin-enable-all>Enable all portals</button></div>' +
        '<div class="scb-admin-portal-list">' + portals.map(function (row) { var on = activeEnabled.indexOf(row[0]) !== -1; return '<div class="scb-admin-portal-pill ' + (on ? '' : 'off') + '"><span>' + esc(row[1]) + '</span><b>' + (on ? 'ON' : 'OFF') + '</b></div>'; }).join('') + '</div>' +
      '</div></section>';
  }

  function userHtml(users) {
    users = users || [];
    return '' +
      '<section class="scb-admin-card">' +
      '<p class="eyebrow">Users and access</p><h2>Inline user controls</h2><p>The broken pop-up has been removed. Create or update real SQL users here. Use password reset from the login flow after the user exists.</p>' +
      '<div class="scb-admin-form">' +
        '<div class="scb-admin-row four">' +
          '<label>Email<input data-admin-user-email placeholder="person@company.com"></label>' +
          '<label>Full name<input data-admin-user-name placeholder="Full name"></label>' +
          '<label>Role<select data-admin-user-role><option value="admin">admin</option><option value="accounting">accounting</option><option value="employee">employee</option><option value="vendor">vendor</option><option value="customer">customer</option><option value="developer">developer</option></select></label>' +
          '<label>Status<select data-admin-user-status><option value="active">active</option><option value="pending">pending</option><option value="disabled">disabled</option></select></label>' +
        '</div>' +
        '<div class="scb-admin-row three">' +
          '<label>Portal access preset<select data-admin-access-preset><option value="full">Full access</option><option value="admin">Admin / office</option><option value="accounting">Accounting</option><option value="employee">Employee</option><option value="vendor">Vendor</option><option value="customer">Customer</option></select></label>' +
          '<label>Jump to user<select data-admin-user-jump><option value="">Select user...</option>' + users.map(function (u) { return '<option value="' + esc(u.email) + '">' + esc(u.full_name || u.name || u.email) + ' · ' + esc(u.role) + '</option>'; }).join('') + '</select></label>' +
          '<label>Access storage<input value="SQL user + local portal profile" readonly></label>' +
        '</div>' +
        '<div class="scb-admin-actions"><button type="button" data-admin-save-user>Save real user</button><button type="button" class="secondary" data-admin-load-users>Reload users</button></div>' +
      '</div>' +
      '<div class="scb-admin-table" style="margin-top:14px">' + (users.length ? users.map(function (u) { return '<div class="scb-admin-user"><div><strong>' + esc(u.full_name || u.name || u.email) + '</strong><small>' + esc(u.email) + '</small></div><span>' + esc(u.role || '') + '</span><span>' + esc(u.status || '') + '</span><button type="button" data-admin-edit-user="' + esc(u.email) + '">Edit</button></div>'; }).join('') : '<div class="scb-admin-portal-pill"><span>No users loaded yet.</span><b>LOAD</b></div>') + '</div>' +
      '</section>';
  }

  function sqlHtml(sql) {
    var tables = sql?.tables || [];
    return '<section class="scb-admin-card"><p class="eyebrow">SQL boards</p><h2>' + esc(sql?.existingCount || 0) + '/' + esc(sql?.expectedCount || 14) + ' tables live</h2><div class="scb-admin-grid">' + tables.slice(0, 8).map(function (t) { return '<div class="scb-admin-metric"><strong>' + esc(t.rowCount == null ? 'Missing' : t.rowCount) + '</strong><span>' + esc(t.label || t.tableName) + '</span></div>'; }).join('') + '</div><div class="scb-admin-actions" style="margin-top:12px"><button type="button" data-admin-refresh>Refresh admin</button><a class="secondary" href="/portal/contacts">Open CRM</a><a class="secondary" href="/portal/accounting">Open Accounting</a></div></section>';
  }

  async function load() {
    var root = shell();
    if (!root) return;
    renderLoading(root);
    var sql = null;
    var users = [];
    try { sql = await getJson('/api/steelcraft/sql-admin/status'); } catch (e) { sql = { existingCount: 'Error', expectedCount: 14, tables: [] }; }
    try { users = (await getJson('/api/steelcraft/admin/users')).users || []; } catch (e) { try { users = (await getJson('/api/auth/users')).users || []; } catch (_) {} }
    root.innerHTML = '' +
      '<section class="scb-admin-card"><p class="eyebrow">Steel Craft Admin</p><h2>Admin Control Center</h2><p>Fixed layout: portal dropdowns at the top, inline users, SQL status, no useless command buttons, no broken pop-up.</p></section>' +
      '<div class="scb-admin-top">' + portalControlsHtml(enabled()) + sqlHtml(sql) + '</div>' +
      userHtml(users);
    bind(root, users);
  }

  function bind(root, users) {
    var openPortal = root.querySelector('[data-admin-open-portal]');
    if (openPortal) openPortal.addEventListener('change', function () { if (openPortal.value) go('/portal/' + openPortal.value); });
    var savePortal = root.querySelector('[data-admin-save-portal]');
    if (savePortal) savePortal.addEventListener('click', function () {
      var id = root.querySelector('[data-admin-config-portal]').value;
      var state = root.querySelector('[data-admin-config-state]').value;
      var current = enabled().filter(function (value) { return value !== id; });
      if (state === 'on') current.push(id);
      setEnabled(Array.from(new Set(current)));
      load();
    });
    var enableAll = root.querySelector('[data-admin-enable-all]');
    if (enableAll) enableAll.addEventListener('click', function () { setEnabled(portals.map(function (row) { return row[0]; })); load(); });
    var refresh = root.querySelector('[data-admin-refresh]');
    if (refresh) refresh.addEventListener('click', load);
    var reload = root.querySelector('[data-admin-load-users]');
    if (reload) reload.addEventListener('click', load);

    root.querySelectorAll('[data-admin-edit-user]').forEach(function (button) {
      button.addEventListener('click', function () {
        var email = button.getAttribute('data-admin-edit-user');
        var user = users.find(function (item) { return item.email === email; });
        if (!user) return;
        root.querySelector('[data-admin-user-email]').value = user.email || '';
        root.querySelector('[data-admin-user-name]').value = user.full_name || user.name || '';
        root.querySelector('[data-admin-user-role]').value = user.role || 'employee';
        root.querySelector('[data-admin-user-status]').value = user.status || 'active';
        root.querySelector('[data-admin-user-email]').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    var jump = root.querySelector('[data-admin-user-jump]');
    if (jump) jump.addEventListener('change', function () { var button = root.querySelector('[data-admin-edit-user="' + CSS.escape(jump.value) + '"]'); if (button) button.click(); });

    var saveUser = root.querySelector('[data-admin-save-user]');
    if (saveUser) saveUser.addEventListener('click', async function () {
      saveUser.disabled = true;
      saveUser.textContent = 'Saving...';
      try {
        var preset = root.querySelector('[data-admin-access-preset]').value;
        var payload = {
          email: root.querySelector('[data-admin-user-email]').value,
          fullName: root.querySelector('[data-admin-user-name]').value,
          role: root.querySelector('[data-admin-user-role]').value,
          status: root.querySelector('[data-admin-user-status]').value,
          portalAccess: presets[preset] || presets.employee,
          actor: 'admin_portal'
        };
        await postJson('/api/steelcraft/admin/users', payload);
        var profiles = read(ACCESS_KEY, {});
        profiles[payload.email] = payload.portalAccess;
        write(ACCESS_KEY, profiles);
        await load();
      } catch (error) {
        alert(error.message || String(error));
        saveUser.disabled = false;
        saveUser.textContent = 'Save real user';
      }
    });
  }

  var lastPath = '';
  function tick() {
    if (!isAdmin()) { document.body.classList.remove('scb-admin-rebuilt'); return; }
    var root = shell();
    if (!root) return;
    if (lastPath !== location.pathname || !root.getAttribute('data-loaded')) {
      lastPath = location.pathname;
      root.setAttribute('data-loaded', 'true');
      load();
    }
  }

  window.addEventListener('load', function () { setTimeout(tick, 250); });
  window.addEventListener('popstate', function () { setTimeout(tick, 100); });
  setInterval(tick, 1000);
  setTimeout(tick, 350);
}());
