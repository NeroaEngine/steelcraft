(function () {
  if (window.__accountingReportsLive) return;
  window.__accountingReportsLive = true;

  var reportData = {
    'General Ledger Detail': [['1000 Cash - Operating', 'Bank feed, deposits, fees, and approved payments', '$214,600'], ['1100 Accounts Receivable', 'Customer invoices and collections activity', '$184,200'], ['2000 Accounts Payable', 'Vendor bills and scheduled payments', '$76,800']],
    'Trial Balance': [['Debits', 'Cash, AR, WIP, COGS, and operating expense balances', '$671,500'], ['Credits', 'AP, retainage, sales revenue, and equity balances', '$671,500'], ['Variance', 'Trial balance is currently in balance', '$0']],
    'Balance Sheet': [['Assets', 'Cash, AR, WIP, deposits, and equipment', '$490,100'], ['Liabilities', 'AP, retainage, deposits, and accrued costs', '$95,400'], ['Equity', 'Current retained equity snapshot', '$394,700']],
    'Profit and Loss': [['Revenue', 'Sales revenue and progress billing', '$311,000'], ['Cost of Goods Sold', 'PO, bill, material, and project costs', '$142,700'], ['Operating Expenses', 'Bank, vendor, payroll, and overhead expenses', '$38,900']],
    'Cash Position': [['Cash available', 'Operating cash tied to bank review workflow', '$214,600'], ['Near-term AR', 'Customer balances due this week', '$82,400'], ['Scheduled AP', 'Approved bills in payment run', '$35,350']],
    'AR Aging Summary': [['Current', 'Active customer invoices inside terms', '$70,300'], ['30-60', 'Follow-up recommended', '$31,500'], ['60+', 'Collections priority queue', '$82,400']],
    'AP Aging Summary': [['Pending approval', 'Vendor bills awaiting owner or PM approval', '$28,900'], ['Scheduled', 'Bills prepared for payment run', '$6,450'], ['Held', 'Compliance or document hold', '$0']],
    'Collections Priority': [['North Ridge Builders', 'Progress draw due this week', '$82,400'], ['Summit Industrial', 'Payment promised Friday', '$31,500'], ['Acme Steel Supply', 'Statement sent', '$70,300']],
    'Payment Run Preview': [['Central Metals', 'Awaiting project manager approval', '$28,900'], ['Rapid Freight', 'Scheduled for payment run', '$6,450'], ['Keystone Fabrication', 'Held pending insurance paperwork', '$0']],
    'Customer Statements': [['North Ridge Builders', 'Statement ready with open progress draw', '$82,400'], ['Summit Industrial', 'Statement ready with promise-to-pay note', '$31,500'], ['Acme Steel Supply', 'Statement already sent', '$70,300']],
    'Vendor Balance Summary': [['Central Metals', 'Open bill awaiting approval', '$28,900'], ['Rapid Freight', 'Approved for scheduled payment', '$6,450'], ['Keystone Fabrication', 'Vendor hold due to paperwork', '$0']],
    'Invoice Register': [['SC-INV-1042', 'Progress billing package', 'Draft'], ['SC-INV-1043', 'Maintenance platform phase 2', 'Ready'], ['SC-INV-1044', 'Material release invoice', 'Review']],
    'Bill Register': [['Central Metals', 'Project material bill awaiting approval', '$28,900'], ['Rapid Freight', 'Freight invoice scheduled', '$6,450'], ['Keystone Fabrication', 'Held pending insurance paperwork', '$0']],
    'Purchase Order Register': [['PO-22018', 'Steel package approved', 'Approved'], ['PO-22019', 'Vendor confirmation needed', 'Pending'], ['PO-22020', 'Receiving not complete', 'Receiving']],
    'PO Receiving Exceptions': [['PO-22019', 'Vendor confirmation missing', 'Pending'], ['PO-22020', 'Partial receiving detected', 'Review'], ['PO-22018', 'No exception', 'Clear']],
    'Schedule of Values Billing': [['Warehouse expansion', 'Steel package 65%, erection 20%', 'Billable'], ['Industrial platform', 'Fabrication 80%, field install pending', 'Review'], ['Storage building', 'Deposit posted, materials not released', 'Hold']],
    'Retainage Report': [['North Ridge Builders', 'Retainage held by progress draw', '$18,600'], ['Summit Industrial', 'Release review pending', '$7,200'], ['Acme Steel Supply', 'No retainage due', '$0']],
    'Change Order Exposure': [['CO-118', 'Added lintels and field welding', 'Pending'], ['CO-119', 'Stair revision and handrail change', 'Approved'], ['CO-120', 'Expedited delivery request', 'Price review']],
    'Project Profitability': [['Warehouse expansion', 'Billing and cost spread reviewed', '31% margin'], ['Industrial platform', 'Fabrication cost on watch', '24% margin'], ['Storage building', 'Materials unreleased', 'Hold']],
    'Job Cost by Cost Code': [['4010 Materials', 'Steel, embeds, paint, and coatings', '$91,300'], ['5010 Labor', 'Fabrication and install labor', '$38,900'], ['6010 Freight', 'Carrier and delivery costs', '$6,450']],
    'Committed Cost Report': [['Open POs', 'Approved, pending, and receiving POs', '$126,650'], ['Pending bills', 'Vendor bills not fully approved', '$28,900'], ['Exposure', 'Known committed cost pressure', '$155,550']],
    'Unbilled Work in Progress': [['Contract Assets / WIP', 'Unbilled work tracked from SOV and job cost', '$91,300'], ['Ready to bill', 'Earned value ready for billing package', '$47,800'], ['Blocked', 'Awaiting approval or release', '$12,600']],
    'Underbilling / Overbilling': [['Underbilling', 'Earned not yet billed', '$47,800'], ['Overbilling', 'Deposits or billing ahead of work', '$9,200'], ['Net position', 'Current billing position', '$38,600']],
    'Revenue Forecast': [['This month', 'Expected billing from open SOV and invoices', '$133,700'], ['Next month', 'Projected progress billing', '$118,400'], ['At risk', 'Requires approval or customer action', '$24,900']],
    'Expense Forecast': [['Vendor bills', 'Upcoming approved and pending bills', '$35,350'], ['PO commitments', 'Open purchase order exposure', '$126,650'], ['Overhead', 'Operating expense forecast', '$38,900']],
    'Gross Margin Review': [['Current revenue', 'Revenue pending close', '$311,000'], ['Current COGS', 'Material, PO, and project costs', '$142,700'], ['Gross margin', 'Estimated current gross margin', '54%']],
    'Bank Reconciliation Exceptions': [['Unmatched deposits', 'Deposits needing customer/project match', '3'], ['Unmatched withdrawals', 'Vendor or bank fee coding needed', '5'], ['Ready to post', 'Reviewed matches ready for approval', '12']],
    'Unmatched Transactions': [['Bank fee', 'Needs expense account coding', 'Review'], ['Customer deposit', 'Needs invoice/customer match', 'Match'], ['Vendor card charge', 'Needs receipt or vendor rule', 'Review']],
    'AI Match Suggestions': [['Customer deposit', 'Matched to North Ridge Builders invoice', '94%'], ['Rapid Freight charge', 'Matched to freight invoice', '91%'], ['Bank fee', 'Matched to operating expense', '87%']],
    'Posting Approval Report': [['Approved', 'Items approved by accounting owner', '12'], ['Rejected', 'Items returned for correction', '2'], ['Pending', 'Items waiting for approval', '8']],
    'Sales Tax Summary': [['Taxable sales', 'Taxable invoice basis', '$214,000'], ['Exempt customers', 'Exemption-backed sales', '$97,000'], ['Filing support', 'Ready for review', 'Ready']],
    '1099 Vendor Review': [['Central Metals', 'W-9 on file', 'Ready'], ['Rapid Freight', '1099 review needed', 'Review'], ['Keystone Fabrication', 'Paperwork hold', 'Hold']],
    'Insurance Hold Report': [['Keystone Fabrication Group', 'COI expires in 12 days', 'Needs review'], ['Summit Industrial', 'Documents current', 'Current'], ['North Ridge Builders', 'Additional insured requested', 'Pending']],
    'Lien Waiver Tracker': [['Warehouse expansion', 'Waiver required before next release', 'Required'], ['Industrial platform', 'Waiver received', 'Received'], ['Storage building', 'Not yet required', 'Watch']],
    'Customer Deposit Report': [['Storage building', 'Deposit posted, materials not released', '$18,000'], ['Warehouse expansion', 'Deposit applied', '$42,500'], ['Industrial platform', 'No unapplied deposit', '$0']],
    'Credit Memo Register': [['CM-204', 'Customer pricing correction', 'Draft'], ['CM-205', 'Material return credit', 'Review'], ['CM-206', 'Approved customer credit', 'Approved']],
    'Refund Register': [['RF-110', 'Customer overpayment review', 'Review'], ['RF-111', 'Vendor rebate refund', 'Ready'], ['RF-112', 'No current refund risk', 'Clear']],
    'Audit Trail': [['Invoice edited', 'SC-INV-1044 moved to review', 'Logged'], ['PO approved', 'PO-22018 approval packet saved', 'Logged'], ['AI suggestion accepted', 'Bank match accepted by accounting owner', 'Logged']],
    'Vault Evidence Report': [['Invoice packet', 'SC-INV-1043 proof packet ready', 'Proof'], ['PO approval', 'PO-22018 receipt stored', 'Proof'], ['Comptroller match', 'AI reason codes stored', 'Proof']],
    'Monthly Close Checklist': [['Trial balance', 'Balanced and ready for review', 'Ready'], ['Bank reconciliation', 'Exceptions still open', 'Review'], ['Posting approvals', '8 approvals pending', 'Pending']],
    'Executive Accounting Snapshot': [['Cash', 'Operating cash snapshot', '$214,600'], ['AR / AP', 'Open AR less scheduled AP', '$148,850'], ['Exceptions', 'Items needing review', '15']],
    'Accounting Exceptions': [['Missing approvals', 'POs, bills, or postings awaiting approval', '8'], ['Uncoded items', 'Transactions needing account coding', '5'], ['Risk flags', 'Compliance, hold, or variance flags', '4']]
  };

  function currentReportPage() {
    return location.pathname.indexOf('/portal/accounting/reports') !== -1;
  }

  function renderRows(rows) {
    return rows.map(function (row) {
      return '<div class="accounting-table-row"><strong>' + row[0] + '</strong><span>' + row[1] + '</span><b>' + row[2] + '</b></div>';
    }).join('');
  }

  function actionNote(action, title) {
    var messages = {
      run: 'Report run completed. The live report output below was refreshed from current accounting demo data.',
      export: 'Export package prepared for ' + title + '. In production this will download CSV/XLSX/PDF based on the selected report.',
      print: 'Print view prepared for ' + title + '. Use the browser print dialog or future PDF renderer.',
      schedule: 'Schedule request created. This report is marked for recurring delivery in the accounting close workflow.',
      comptroller: 'Sent to Neroa Comptroller review queue with evidence and reason-code context.'
    };
    return '<div class="accounting-report-action-note"><strong>' + action.toUpperCase() + '</strong> - ' + (messages[action] || messages.run) + '</div>';
  }

  function runAction(panel, action) {
    var title = panel.dataset.reportTitle || 'Accounting report';
    var rows = reportData[title] || [[title, 'Live report generated from accounting demo data.', 'Live']];
    var status = panel.querySelector('[data-report-status]');
    var output = panel.querySelector('[data-report-output]');
    if (status) status.innerHTML = '<span>Last action: ' + action + '</span><span>Updated: just now</span><span>Rows generated: ' + rows.length + '</span>';
    if (output) output.innerHTML = actionNote(action, title) + '<div class="accounting-table">' + renderRows(rows) + '</div>';
  }

  function panelHtml(title, description) {
    var rows = reportData[title] || [[title, description || 'Live report generated from accounting demo data.', 'Live']];
    return '' +
      '<div class="accounting-report-live-panel" data-accounting-report-live-panel="true" data-report-title="' + title.replace(/"/g, '&quot;') + '">' +
        '<p class="eyebrow">Live accounting report</p>' +
        '<h3>' + title + '</h3>' +
        '<p>' + (description || 'Live accounting report generated from current accounting demo data.') + '</p>' +
        '<div class="accounting-report-live-summary">' +
          '<span>Rows: ' + rows.length + '</span>' +
          '<span>Status: Ready to run</span>' +
          '<span>Source: Accounting demo ledger</span>' +
          '<span>Comptroller-ready</span>' +
        '</div>' +
        '<div class="accounting-report-live-actions">' +
          '<button type="button" data-report-action="run">Run Report</button>' +
          '<button type="button" data-report-action="export">Export Package</button>' +
          '<button type="button" data-report-action="print">Prepare Print View</button>' +
          '<button type="button" data-report-action="schedule">Schedule Delivery</button>' +
          '<button type="button" data-report-action="comptroller">Send to Comptroller</button>' +
        '</div>' +
        '<div class="accounting-report-live-status" data-report-status><span>Waiting for action</span></div>' +
        '<div class="accounting-report-output" data-report-output><div class="accounting-report-action-note"><strong>Ready</strong> - Choose Run Report to generate the live report output.</div></div>' +
      '</div>';
  }

  function enhanceReports() {
    if (!currentReportPage()) return;
    var room = document.querySelector('.accounting-report-room');
    if (!room) return;
    var reportRows = Array.from(room.querySelectorAll('.accounting-table-row')).filter(function (row) {
      return !row.closest('[data-accounting-report-live-panel="true"]');
    });
    if (!reportRows.length) return;
    reportRows.forEach(function (row) {
      if (row.dataset.liveReport === 'true') return;
      var title = row.querySelector('strong')?.textContent?.trim();
      var description = row.querySelector('span')?.textContent?.trim();
      if (!title) return;
      row.dataset.liveReport = 'true';
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', 'Open live report: ' + title);
      var status = row.querySelector('b');
      if (status) status.textContent = 'Open';
      function openReport() {
        var existing = room.querySelector('[data-accounting-report-live-panel="true"]');
        if (existing) existing.remove();
        room.insertAdjacentHTML('afterbegin', panelHtml(title, description));
      }
      row.addEventListener('click', openReport);
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openReport();
        }
      });
    });
    if (!room.querySelector('[data-accounting-report-live-panel="true"]')) {
      var first = reportRows[0];
      var firstTitle = first.querySelector('strong')?.textContent?.trim() || 'General Ledger Detail';
      var firstDescription = first.querySelector('span')?.textContent?.trim() || '';
      room.insertAdjacentHTML('afterbegin', panelHtml(firstTitle, firstDescription));
    }
  }

  function schedule() {
    window.setTimeout(enhanceReports, 80);
    window.setTimeout(enhanceReports, 250);
  }

  window.addEventListener('load', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('click', function (event) {
    var actionButton = event.target.closest('[data-report-action]');
    if (actionButton) {
      var panel = actionButton.closest('[data-accounting-report-live-panel="true"]');
      if (panel) runAction(panel, actionButton.dataset.reportAction);
      return;
    }
    if (event.target && (event.target.closest('.accounting-section-nav') || event.target.closest('.nav-list'))) schedule();
  });
  if (document.readyState !== 'loading') schedule();
}());
