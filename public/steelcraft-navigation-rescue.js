(function () {
  var PORTAL_ROUTES = {
    admin: '/portal/admin',
    administration: '/portal/admin',
    accounting: '/portal/accounting',
    accounts: '/portal/contacts',
    contacts: '/portal/contacts',
    crm: '/portal/contacts',
    'contacts / crm': '/portal/contacts',
    hr: '/portal/hr',
    vendor: '/portal/vendor',
    customer: '/portal/customer',
    employee: '/portal/employee',
    'employee self-service': '/portal/employee',
    'sales pipeline': '/portal/contacts/sales-pipeline',
    'open sales pipeline': '/portal/contacts/sales-pipeline',
    'lead board': '/portal/contacts/sales-pipeline?board=lead',
    'quote / estimate board': '/portal/contacts/sales-pipeline?board=quote',
    'job / project board': '/portal/contacts/sales-pipeline?board=job'
  };

  function isPortalPath(path) {
    return /^\/portal(\/|$)/.test(path || location.pathname || '');
  }

  function normalizeLabel(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function cleanupBlackouts() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';

    document.querySelectorAll('[data-estimate-builder-modal], [data-workbook-override], [data-route-blocker], .estimate-card-backdrop').forEach(function (node) {
      node.remove();
    });

    document.querySelectorAll('.dock-backdrop.open, .portal-dock.open').forEach(function (node) {
      node.classList.remove('open');
    });

    document.querySelectorAll('.dock-backdrop').forEach(function (node) {
      if (getComputedStyle(node).position === 'fixed' && node.classList.contains('open')) node.classList.remove('open');
    });

    var workspace = document.querySelector('.workspace');
    if (workspace) {
      workspace.removeAttribute('data-crm-sales-mounted');
      workspace.removeAttribute('data-crm-sales-pipeline-mounted');
      workspace.removeAttribute('data-sales-import-mounted');
      workspace.removeAttribute('data-admin-mounted');
    }
  }

  function go(path) {
    if (!path) return;
    cleanupBlackouts();
    history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setTimeout(cleanupBlackouts, 0);
    setTimeout(cleanupBlackouts, 150);
  }

  function routeForButton(button) {
    if (!button) return '';
    var href = button.getAttribute && button.getAttribute('href');
    if (href && isPortalPath(href)) return href;

    var label = normalizeLabel(button.textContent);
    if (PORTAL_ROUTES[label]) return PORTAL_ROUTES[label];

    if (label.indexOf('admin') >= 0) return '/portal/admin';
    if (label.indexOf('accounting') >= 0) return '/portal/accounting';
    if (label.indexOf('contacts') >= 0 || label === 'crm') return '/portal/contacts';
    if (label.indexOf('sales pipeline') >= 0) return '/portal/contacts/sales-pipeline';
    if (label.indexOf('quote') >= 0 && label.indexOf('estimate') >= 0) return '/portal/contacts/sales-pipeline?board=quote';
    if (label.indexOf('job') >= 0 && label.indexOf('project') >= 0) return '/portal/contacts/sales-pipeline?board=job';
    if (label.indexOf('lead board') >= 0) return '/portal/contacts/sales-pipeline?board=lead';
    return '';
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('a,button,[role="button"]') : null;
    var route = routeForButton(target);
    if (!route) return;

    event.preventDefault();
    event.stopPropagation();
    go(route);
  }, true);

  ['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      if (isPortalPath(location.pathname)) setTimeout(cleanupBlackouts, 0);
      return result;
    };
  });

  window.addEventListener('popstate', function () {
    setTimeout(cleanupBlackouts, 0);
    setTimeout(cleanupBlackouts, 150);
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') cleanupBlackouts();
  });

  setInterval(function () {
    if (!isPortalPath(location.pathname)) return;
    cleanupBlackouts();
  }, 1200);

  cleanupBlackouts();
}());
