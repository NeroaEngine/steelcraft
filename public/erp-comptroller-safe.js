(function () {
  if (window.__erpComptrollerPromoted) return;
  window.__erpComptrollerPromoted = true;

  function replaceText(text) {
    return String(text || '')
      .replace(/Neroa accounting worker/g, 'Neroa Comptroller')
      .replace(/AI agents prepare the accounting work, flag risk, and create review items\. The human approves before anything posts\./g, 'The Comptroller controls the daily accounting work inside the ERP: cash, receivables, payables, bank matches, reports, risk, approvals, and proof-ready posting.')
      .replace(/Neroa reviews receivables, payables, tax, cash, and project risk before the user has to hunt for it\./g, 'The Neroa Comptroller reviews receivables, payables, tax, cash, project risk, and daily actions before the owner has to hunt for it.')
      .replace(/The banking worker will match deposits, card charges, vendors, projects, and ledger accounts before posting\./g, 'The Neroa Comptroller matches deposits, card charges, vendors, projects, and ledger accounts, then prepares an owner approval packet before posting.')
      .replace(/Report agents watch trends, drill down monthly, explain changes, and flag cash-flow problems before they hit the owner\./g, 'The Neroa Comptroller watches trends, drills down monthly, explains changes, and flags cash-flow problems before they hit the owner.')
      .replace(/Run worker review/g, 'Run Comptroller')
      .replace(/Open review queue/g, 'Open approval packet')
      .replace(/Approve high-confidence items/g, 'Approve matched items')
      .replace(/AR worker/g, 'AR Comptroller')
      .replace(/AP worker/g, 'AP Comptroller')
      .replace(/Cash worker/g, 'Cash Comptroller')
      .replace(/Deposit worker/g, 'Deposit Comptroller')
      .replace(/Bookkeeper/g, 'Comptroller')
      .replace(/Review queue/g, 'Approval packet')
      .replace(/Margin worker/g, 'Margin Comptroller')
      .replace(/Coding worker/g, 'Coding Comptroller')
      .replace(/Forecast worker/g, 'Forecast Comptroller')
      .replace(/Report agent/g, 'Report Comptroller')
      .replace(/Cash agent/g, 'Cash Comptroller')
      .replace(/Budget agent/g, 'Budget Comptroller')
      .replace(/Ledger worker/g, 'Ledger Comptroller')
      .replace(/Audit worker/g, 'Audit Comptroller')
      .replace(/Proof worker/g, 'Proof Comptroller')
      .replace(/Payroll worker/g, 'Payroll Comptroller')
      .replace(/Labor agent/g, 'Labor Comptroller')
      .replace(/Cost worker/g, 'Cost Comptroller')
      .replace(/Integration agent/g, 'Integration Comptroller')
      .replace(/Mapping worker/g, 'Mapping Comptroller')
      .replace(/Control worker/g, 'Control Comptroller')
      .replace(/worker/g, 'Comptroller')
      .replace(/Worker/g, 'Comptroller');
  }

  function promoteCard(card) {
    if (!card || card.dataset.comptrollerPromoted === 'true') return;
    card.dataset.comptrollerPromoted = 'true';
    card.classList.add('erp-comptroller-card');
    var heading = card.querySelector('h2');
    if (heading) heading.textContent = 'Neroa Comptroller';
    card.querySelectorAll('p, button, strong, span, b, small').forEach(function (node) {
      if (!node.children.length && node.textContent) node.textContent = replaceText(node.textContent);
    });
  }

  function promoteAll() {
    document.querySelectorAll('.accounting-ai-worker').forEach(promoteCard);
  }

  function schedulePromote() {
    var ticks = 0;
    promoteAll();
    var timer = window.setInterval(function () {
      promoteAll();
      ticks += 1;
      if (ticks >= 12) window.clearInterval(timer);
    }, 250);
  }

  window.addEventListener('load', schedulePromote);
  window.addEventListener('popstate', schedulePromote);
  document.addEventListener('click', function (event) {
    if (event.target && (event.target.closest('.nav-list') || event.target.closest('.accounting-section-nav'))) {
      window.setTimeout(schedulePromote, 120);
    }
  });
  if (document.readyState !== 'loading') schedulePromote();
}());
