(function () {
  if (window.__accountingSetupLayoutSafe) return;
  window.__accountingSetupLayoutSafe = true;

  function isSetupRoom() {
    var heading = document.querySelector('.accounting-room-heading h1');
    return heading && heading.textContent.trim() === 'Setup';
  }

  function classifySetupCard(card) {
    var title = card.querySelector('h2');
    if (!title) return;
    var text = title.textContent.trim();
    card.classList.remove('setup-numbering-card', 'setup-tax-card', 'setup-contact-card', 'setup-list-card', 'setup-advanced-card');
    if (text === 'Invoice numbers' || text === 'Quote numbers') card.classList.add('setup-numbering-card');
    if (text === 'Tax location') card.classList.add('setup-tax-card');
    if (text === 'Add customer' || text === 'Add vendor') card.classList.add('setup-contact-card');
    if (text === 'Customers' || text === 'Vendors' || text === 'Chart of accounts') card.classList.add('setup-list-card');
    if (text === 'Advanced setup') card.classList.add('setup-advanced-card');
  }

  function organize() {
    document.querySelectorAll('.accounting-focus-grid').forEach(function (grid) {
      if (!isSetupRoom()) {
        grid.classList.remove('accounting-setup-layout-safe');
        return;
      }
      grid.classList.add('accounting-setup-layout-safe');
      Array.from(grid.children).forEach(function (card) {
        if (card.classList && card.classList.contains('feature')) classifySetupCard(card);
      });
    });
  }

  function schedule() {
    var count = 0;
    organize();
    var timer = window.setInterval(function () {
      organize();
      count += 1;
      if (count >= 8) window.clearInterval(timer);
    }, 200);
  }

  window.addEventListener('load', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('click', function (event) {
    if (event.target && (event.target.closest('.accounting-section-nav') || event.target.closest('.dock-card') || event.target.closest('.nav-list'))) {
      window.setTimeout(schedule, 120);
    }
  });
  if (document.readyState !== 'loading') schedule();
}());
