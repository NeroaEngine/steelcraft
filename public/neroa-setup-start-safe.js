(function () {
  if (window.__neroaSetupStartSafe) return;
  window.__neroaSetupStartSafe = true;

  var open = false;

  function json(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key));
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function repairAdminAndBrandState() {
    var enabledKey = 'steelcraft_enabled_portals_v1';
    var savedEnabled = json(enabledKey, []);
    if (!Array.isArray(savedEnabled)) savedEnabled = [];
    var mustHave = ['admin', 'contacts', 'accounting', 'employee', 'vendor', 'customer', 'hr'];
    saveJson(enabledKey, Array.from(new Set(mustHave.concat(savedEnabled))));

    var brandKey = 'steelcraft_brand_controls_v1';
    var brand = json(brandKey, {});
    if (!brand || typeof brand !== 'object') brand = {};
    if (!brand.logoUrl || brand.logoMode === 'initials' || brand.logoMode === 'text') {
      brand.logoUrl = '/brand/scb-logo.png';
      brand.logoMode = 'image';
      brand.logoShape = 'wide';
      brand.logoSize = 170;
      saveJson(brandKey, brand);
    }
  }

  function quarantineBrokenCrmState() {
    var crmKey = 'steelcraft_crm_records_v15';
    var saved = json(crmKey, null);
    if (!saved) return;

    var accounts = Array.isArray(saved.accounts) ? saved.accounts : [];
    var contacts = Array.isArray(saved.contacts) ? saved.contacts : [];
    var looksBroken = !accounts.length || !contacts.length || accounts.length < 25 || contacts.length < 25;

    if (looksBroken) {
      var stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      var backupKey = crmKey + '_quarantined_' + stamp;
      saveJson(backupKey, saved);
      localStorage.removeItem(crmKey);
      localStorage.setItem('steelcraft_crm_recovery_notice', 'Broken CRM browser state was quarantined. Backup key: ' + backupKey);
    }
  }

  repairAdminAndBrandState();
  quarantineBrokenCrmState();

  function currentPortal() {
    var match = (location.pathname || '').match(/^\/portal\/([^/]+)/);
    return match ? match[1] : '';
  }

  function go(path) {
    history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function shell() {
    if (document.querySelector('[data-neroa-setup-root]')) return;
    var root = document.createElement('div');
    root.dataset.neroaSetupRoot = 'true';
    root.innerHTML = '' +
      '<button class="neroa-setup-start-button" type="button" data-setup-action="toggle"><span></span>Start Setup</button>' +
      '<section class="neroa-setup-start-panel" data-setup-panel="true">' +
        '<div class="neroa-setup-head"><div><p class="eyebrow">Neroa Comptroller Setup</p><h2>Set up the business fast</h2><p>The Comptroller should guide the owner from contacts to accounting, payroll, bank feeds, fixed costs, reports, and daily approvals.</p></div><button class="neroa-setup-close" type="button" data-setup-action="close">×</button></div>' +
        '<div class="neroa-setup-body">' +
          step(1, 'Contacts / CRM', 'Start by importing customers, vendors, contractors, project contacts, and account history.', '/portal/contacts') +
          step(2, 'Accounting setup', 'Tax location, invoice numbers, quote numbers, chart of accounts, customers, and vendors.', '/portal/accounting/setup') +
          step(3, 'Payroll Prep', 'Employees, hourly rates, loaded labor, payroll journal, production labor cost, and approvals.', '/portal/accounting/payroll') +
          step(4, 'Banking + Cards', 'Bank feed, debit cards, payment matching, approval packet, and proof-ready posting.', '/portal/accounting/banking') +
          step(5, 'Reports', 'Daily Comptroller brief, P&L, cash flow, AR/AP aging, production efficiency, and proof trail.', '/portal/accounting/reports') +
          '<div class="neroa-setup-note"><strong>Setup rule:</strong> Neroa Connect handles communication. Neroa Comptroller lives inside the ERP and controls the setup workflow, approvals, payroll prep, accounting cleanup, and daily report.</div>' +
        '</div>' +
      '</section>';
    document.body.appendChild(root);
    root.addEventListener('click', function (event) {
      var action = event.target.closest('[data-setup-action]');
      var launch = event.target.closest('[data-setup-launch]');
      if (action) {
        var name = action.getAttribute('data-setup-action');
        if (name === 'toggle') toggle();
        if (name === 'close') closePanel();
      }
      if (launch) {
        go(launch.getAttribute('data-setup-launch'));
        closePanel();
      }
    });
  }

  function step(number, title, description, path) {
    return '<div class="neroa-setup-step"><b>' + number + '</b><div><strong>' + title + '</strong><span>' + description + '</span></div><button type="button" data-setup-launch="' + path + '">Open</button></div>';
  }

  function toggle() {
    open = !open;
    var panel = document.querySelector('[data-setup-panel]');
    if (panel) panel.classList.toggle('open', open);
  }

  function closePanel() {
    open = false;
    var panel = document.querySelector('[data-setup-panel]');
    if (panel) panel.classList.remove('open');
  }

  function enhanceContacts() {
    if (currentPortal() !== 'contacts') return;
    var main = document.querySelector('.workspace-grid .feature.large');
    var registry = document.querySelector('.workspace-grid .feature:not(.large)');
    if (main && !main.querySelector('[data-crm-live]')) {
      var crm = document.createElement('div');
      crm.dataset.crmLive = 'true';
      crm.className = 'contacts-crm-live-grid';
      crm.innerHTML = '' +
        crmCard('Companies', 'Master company record. Customers, vendors, contractors, and account history should roll up here.', [
          ['Atlas Apparel', 'Customer', 'Open'],
          ['Blank Shirt Supply', 'Vendor', 'Ready'],
          ['Apex Roofing', 'Customer', 'AR watch']
        ]) +
        crmCard('People', 'Contacts connected to companies, jobs, approvals, invoices, and messages.', [
          ['Seth McBride', 'Admin / Owner', 'Primary'],
          ['Maria Lane', 'Production contact', 'Team'],
          ['Vendor Rep', 'Supply contact', 'Vendor']
        ]) +
        crmCard('Setup import', 'The Comptroller should ask for customer and vendor lists, clean duplicates, classify contacts, then push them into accounting.', [
          ['Customer CSV', 'Import and clean', 'Next'],
          ['Vendor CSV', 'Import and clean', 'Next'],
          ['QuickBooks contacts', 'Optional sync', 'Bridge']
        ]) +
        crmCard('Linked history', 'Every contact should connect to quotes, jobs, invoices, payments, photo approvals, messages, and proof events.', [
          ['Quote history', 'Connect to sales', 'Planned'],
          ['Invoice history', 'Connect to accounting', 'Planned'],
          ['Message history', 'Connect to Neroa Connect', 'Planned']
        ]);
      main.appendChild(crm);
      var actions = document.createElement('div');
      actions.className = 'crm-action-row';
      actions.innerHTML = '<button type="button" data-setup-launch="/portal/accounting/setup">Start Accounting Setup</button><button type="button" data-setup-launch="/portal/accounting/payroll">Open Payroll Prep</button><button type="button" data-setup-launch="/portal/accounting/banking">Connect Banking</button>';
      main.appendChild(actions);
    }
    if (registry && !registry.classList.contains('portal-registry-explain')) {
      registry.classList.add('portal-registry-explain');
      var p = document.createElement('p');
      p.className = 'notice';
      p.textContent = 'Portal registry means this Contacts / CRM module is a canonical core module. Data boundary means contact records are reusable across all tenants and industry packs, while industry-specific details extend the same master company/contact record.';
      registry.appendChild(p);
    }
  }

  function crmCard(title, description, rows) {
    return '<article class="contacts-crm-card"><h3>' + title + '</h3><p>' + description + '</p><div class="contacts-crm-list">' + rows.map(function (row) {
      return '<div class="contacts-crm-row"><div><strong>' + row[0] + '</strong><span>' + row[1] + '</span></div><b>' + row[2] + '</b></div>';
    }).join('') + '</div></article>';
  }

  function tick() {
    repairAdminAndBrandState();
    shell();
    enhanceContacts();
  }

  window.addEventListener('load', tick);
  window.addEventListener('popstate', function () { window.setTimeout(tick, 120); });
  document.addEventListener('click', function () { window.setTimeout(tick, 160); });
  if (document.readyState !== 'loading') tick();
}());
