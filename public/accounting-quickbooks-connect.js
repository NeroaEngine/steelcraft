(function(){
  if (window.__steelcraftQuickBooksConnectLink) return;
  window.__steelcraftQuickBooksConnectLink = true;
  function onAccounting(){ return location.pathname.indexOf('/portal/accounting') === 0; }
  function installStyle(){
    if (document.getElementById('qb-connect-style')) return;
    var s = document.createElement('style');
    s.id = 'qb-connect-style';
    s.textContent = '.qb-connect-strip{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.05);padding:14px;display:grid;gap:10px;margin-bottom:14px}.qb-connect-strip h2{margin:0;font-size:24px}.qb-connect-strip p{margin:0;color:var(--muted)}.qb-connect-actions{display:flex;gap:8px;flex-wrap:wrap}.qb-connect-button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:var(--brand-accent);color:#fff!important;padding:11px 16px;font-weight:950;text-decoration:none}.qb-connect-secondary{border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--text)!important}.qb-connect-status{border:1px solid var(--line);border-radius:12px;padding:9px 11px;color:var(--muted)}';
    document.head.appendChild(s);
  }
  async function loadStatus(root){
    var status = root.querySelector('[data-qb-status]');
    if (!status) return;
    try {
      var response = await fetch('/api/integrations/quickbooks/status', { credentials: 'same-origin' });
      var json = await response.json();
      status.textContent = json.connected ? ('Connected to QuickBooks company ' + json.realmId) : 'Not connected yet. Click Connect QuickBooks to sign in and authorize.';
    } catch (error) { status.textContent = 'QuickBooks backend route is not available yet.'; }
  }
  function install(){
    if (!onAccounting()) return;
    installStyle();
    var workspace = document.querySelector('.workspace');
    if (!workspace) return;
    var existing = document.getElementById('quickbooks-real-connect');
    if (existing) return loadStatus(existing);
    var box = document.createElement('section');
    box.id = 'quickbooks-real-connect';
    box.className = 'qb-connect-strip';
    box.innerHTML = '<div><p class="eyebrow">QuickBooks Integration</p><h2>Connect QuickBooks Online</h2><p>This is a real link to the server-side QuickBooks sign-in flow. The customer signs in to QuickBooks and grants access.</p></div><div class="qb-connect-actions"><a class="qb-connect-button" href="/api/integrations/quickbooks/connect?returnTo=/portal/accounting/setup">Connect QuickBooks</a><a class="qb-connect-button qb-connect-secondary" href="/api/integrations/quickbooks/status">Check Status</a><a class="qb-connect-button qb-connect-secondary" href="/api/integrations/quickbooks/bank-accounts">View Bank Accounts</a></div><div class="qb-connect-status" data-qb-status>Checking QuickBooks status...</div>';
    workspace.prepend(box);
    loadStatus(box);
  }
  window.addEventListener('popstate', function(){ setTimeout(install, 80); });
  new MutationObserver(function(){ setTimeout(install, 120); }).observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(install, 80);
  setTimeout(install, 700);
})();
