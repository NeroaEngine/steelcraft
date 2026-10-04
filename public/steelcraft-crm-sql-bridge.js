(function () {
  var CRM_KEY = 'steelcraft_crm_records_v15';
  var OLD_KEYS = ['steelcraft_crm_records_v14', 'steelcraft_crm_records_v13', 'steelcraft_crm_records_v12', 'steelcraft_crm_records_v11', 'steelcraft_crm_records_v10', 'steelcraft_crm_records_v9', 'steelcraft_crm_records_v8', 'steelcraft_crm_records_v7', 'steelcraft_crm_records_v6', 'steelcraft_crm_records_v5', 'steelcraft_live_crm_records_v3'];
  var API = '/api/steelcraft/crm/records';
  var MOUNT_ID = 'steelcraft-crm-sql-status';
  var debounceTimer = null;
  var syncing = false;

  function isCrmPath() {
    return /^\/portal\/contacts\/?$/.test(location.pathname || '');
  }

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }

  function readLocalCrm() {
    var current = readJson(CRM_KEY);
    if (current && current.accounts && current.accounts.length) return current;
    for (var i = 0; i < OLD_KEYS.length; i += 1) {
      var old = readJson(OLD_KEYS[i]);
      if (old && old.accounts && old.accounts.length) return old;
    }
    return current || { accounts: [], contacts: [] };
  }

  function renderBadge(text, state) {
    if (!isCrmPath()) return;
    var workspace = document.querySelector('.workspace');
    if (!workspace) return;
    var root = document.getElementById(MOUNT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = MOUNT_ID;
      root.style.cssText = 'position:sticky;top:8px;z-index:20;margin:0 0 12px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.58);backdrop-filter:blur(10px);color:#fff;font-weight:950;width:max-content;max-width:100%;box-shadow:0 12px 30px rgba(0,0,0,.25)';
      workspace.insertBefore(root, workspace.firstChild);
    }
    root.textContent = text;
    root.setAttribute('data-state', state || 'ok');
  }

  async function fetchSqlRecords() {
    var response = await fetch(API, { headers: { Accept: 'application/json' } });
    var data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'CRM SQL read failed.');
    return data;
  }

  async function pushLocalToSql(reason) {
    if (syncing) return;
    var payload = readLocalCrm();
    if (!payload || (!payload.accounts?.length && !payload.contacts?.length)) return;
    syncing = true;
    renderBadge('CRM SQL sync running...', 'working');
    try {
      var response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ accounts: payload.accounts || [], contacts: payload.contacts || [], source: reason || 'browser_crm', actor: 'browser_crm_sql_bridge' })
      });
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'CRM SQL write failed.');
      renderBadge('CRM SQL backed: ' + (data.counts?.accounts || data.accounts?.length || 0) + ' accounts / ' + (data.counts?.contacts || data.contacts?.length || 0) + ' contacts', 'ok');
      window.dispatchEvent(new CustomEvent('steelcraft-crm-sql-synced', { detail: data }));
    } catch (error) {
      renderBadge('CRM SQL sync error: ' + (error.message || error), 'error');
    } finally {
      syncing = false;
    }
  }

  function schedulePush(reason) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { pushLocalToSql(reason); }, 850);
  }

  async function bootstrapCrmSql() {
    if (!isCrmPath()) return;
    renderBadge('CRM SQL checking...', 'working');
    try {
      var sql = await fetchSqlRecords();
      var sqlAccounts = sql.accounts || [];
      var sqlContacts = sql.contacts || [];
      var local = readLocalCrm();
      var localCount = (local.accounts || []).length + (local.contacts || []).length;
      var sqlCount = sqlAccounts.length + sqlContacts.length;

      if (sqlCount > 0 && sessionStorage.getItem('steelcraft_crm_sql_loaded_once') !== 'yes') {
        sessionStorage.setItem('steelcraft_crm_sql_loaded_once', 'yes');
        localStorage.setItem(CRM_KEY, JSON.stringify({ accounts: sqlAccounts, contacts: sqlContacts, source: 'steelcraft_sql', sqlLoadedAt: new Date().toISOString() }));
        renderBadge('CRM loaded from SQL: ' + sqlAccounts.length + ' accounts / ' + sqlContacts.length + ' contacts', 'ok');
        setTimeout(function () { location.reload(); }, 350);
        return;
      }

      if (sqlCount === 0 && localCount > 0) {
        await pushLocalToSql('initial_browser_to_sql_seed');
        return;
      }

      renderBadge('CRM SQL backed: ' + sqlAccounts.length + ' accounts / ' + sqlContacts.length + ' contacts', 'ok');
    } catch (error) {
      renderBadge('CRM SQL offline: ' + (error.message || error), 'error');
    }
  }

  if (!Storage.prototype.__steelcraftCrmSqlBridgePatched) {
    var originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      var result = originalSetItem.apply(this, arguments);
      if (key === CRM_KEY && isCrmPath()) schedulePush('localstorage_setItem');
      return result;
    };
    Object.defineProperty(Storage.prototype, '__steelcraftCrmSqlBridgePatched', { value: true });
  }

  var lastPath = '';
  function tick() {
    if (!isCrmPath()) return;
    if (lastPath !== location.pathname) {
      lastPath = location.pathname;
      setTimeout(bootstrapCrmSql, 350);
    }
  }

  window.addEventListener('load', function () { setTimeout(bootstrapCrmSql, 600); });
  window.addEventListener('popstate', function () { setTimeout(tick, 100); });
  setInterval(tick, 1000);
}());
