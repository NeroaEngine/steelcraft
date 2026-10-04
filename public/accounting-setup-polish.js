(function () {
  function setupRoomActive() {
    var title = document.querySelector('.accounting-room-heading h1');
    return title && title.textContent.trim() === 'Setup';
  }

  function makeSetupCard(title, text, items, tag) {
    var card = document.createElement('article');
    card.className = 'feature panel accounting-form-card accounting-setup-priority-card ' + (tag || '');
    card.dataset.accountingSetupInserted = tag || 'setup';
    card.innerHTML = '<p class="eyebrow">Automated setup</p><h2>' + title + '</h2><p>' + text + '</p><div class="accounting-worker-list">' + items.map(function (item) {
      return '<div class="accounting-worker-item"><strong>' + item[0] + '</strong><span>' + item[1] + '</span><b>' + item[2] + '</b></div>';
    }).join('') + '</div><div class="accounting-actions-list"><button type="button">Upload customer list</button><button type="button">Upload vendor list</button><button type="button">Find vendor APIs</button><button type="button">Run setup assistant</button></div>';
    return card;
  }

  function polishSetup() {
    if (!setupRoomActive()) return;
    var heading = document.querySelector('.accounting-room-heading h1');
    var desc = document.querySelector('.accounting-room-heading p:not(.eyebrow)');
    if (heading) heading.textContent = 'Accounting Setup';
    if (desc) desc.textContent = 'Automated accounting foundation, customer/vendor import, tax, numbering, and system controls.';

    var grid = document.querySelector('.accounting-focus-grid');
    if (!grid) return;
    grid.classList.add('accounting-setup-grid');

    if (!grid.querySelector('[data-accounting-setup-inserted="auto"]')) {
      var auto = makeSetupCard(
        'Automated setup assistant',
        'Neroa should ask for the customer list, vendor list, tax location, starting invoice and quote numbers, then build the foundation. If a vendor has an API, Neroa should connect to that first for immediate setup.',
        [
          ['Customer list', 'Upload CSV/XLSX or import from QuickBooks. Neroa maps names, emails, terms, and balances.', 'Import'],
          ['Vendor list', 'Upload vendors or connect supplier APIs where available.', 'Import/API'],
          ['Bank + QuickBooks', 'Connect bank feed and optional QuickBooks so setup does not become manual entry.', 'Connect'],
          ['Comptroller setup', 'Capture fixed costs, credit rules, daily report time, and approval recipients.', 'Next']
        ],
        'auto'
      );
      grid.prepend(auto);
    }

    var cards = Array.from(grid.children);
    cards.forEach(function (card) {
      var h2 = card.querySelector('h2');
      if (!h2) return;
      var title = h2.textContent.trim();
      if (title === 'Advanced setup') {
        card.classList.add('accounting-setup-advanced-card');
        grid.insertBefore(card, grid.children[1] || null);
      }
      if (title === 'Invoice numbers') card.classList.add('accounting-setup-number-card');
      if (title === 'Quote numbers') card.classList.add('accounting-setup-number-card');
      if (title === 'Tax location') card.classList.add('accounting-setup-tax-card');
      if (title === 'Add customer' || title === 'Add vendor') card.classList.add('accounting-setup-compact-form');
    });
  }

  window.addEventListener('load', polishSetup);
  new MutationObserver(polishSetup).observe(document.documentElement, { childList: true, subtree: true });
}());
