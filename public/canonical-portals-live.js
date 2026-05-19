(function () {
  if (window.__canonicalPortalsLive) return;
  window.__canonicalPortalsLive = true;

  var data = {
    contacts: ['Contacts / CRM', 'Companies, people, customer accounts, vendors, contractors, project contacts, account history, duplicate cleanup, and accounting handoff.', [['Companies','128','Customer/vendor/contractor'], ['People','342','Contacts and approvers'], ['Cleanup','18','Duplicates/missing data'], ['Linked','91%','Jobs/invoices/messages']], ['Customer accounts', 'Vendor accounts', 'Import cleanup', 'Linked history']],
    hr: ['HR Portal', 'Employees, onboarding, handbook, training, PTO, payroll prep connection, labor rates, and employee documents.', [['Employees','17','Active crew'], ['Training','4','Due'], ['PTO','2','Pending'], ['Payroll','91%','Ready']], ['Employee records', 'Onboarding', 'Payroll prep', 'Training + PTO']],
    vendor: ['Vendor Portal', 'Outside vendor packets, PO visibility, due dates, upload slots, receiving status, AP bill connection, and vendor communication.', [['Packets','19','Open'], ['Uploads','5','Needed'], ['Late','3','Follow-up'], ['AP links','14','Bills ready']], ['Vendor packets', 'Upload requests', 'Receiving', 'AP bill links']],
    customer: ['Customer Portal', 'Customer-facing job status, quotes, contracts, change orders, payments, uploads, photo approvals, and communication.', [['Approvals','11','Customer action'], ['Invoices','$27k','Open AR'], ['Uploads','6','Needed'], ['Threads','22','Active']], ['Approvals', 'Payments', 'Documents', 'Neroa Connect']],
    employee: ['Employee Self-Service', 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and employee help.', [['Training','4 due','Assignments'], ['PTO','2','Pending'], ['Docs','12','Files'], ['Help','Live','Neroa']], ['Profile', 'PTO', 'Training', 'HR help']]
  };

  var rows = {
    contacts: [['Atlas Apparel','Customer account verified','Ready'], ['Blank Shirt Supply','Vendor terms captured','Ready'], ['Apex Roofing','Credit watch','Review']],
    hr: [['John Rivera','Press Lead - $25/hr','Active'], ['Maria Lane','Press Operator - $24/hr','Active'], ['Noah Ward','Runner - $16/hr','Active']],
    vendor: [['Blank Shirt Supply','PO-5001 confirm ship date','Open'], ['InkPro Distribution','Pricing confirmation','Need'], ['Screen Room Supply','Late delivery','Escalate']],
    customer: [['JOB-24018','Photo approval ready','Send'], ['SCB-Q-1002','Quote approval','Send'], ['INV-1007','Payment reminder','AR']],
    employee: [['PTO request','Submit time off','Open'], ['Safety training','Due this week','Due'], ['Handbook','Acknowledgement required','Sign']]
  };

  function portalId() {
    var match = (location.pathname || '').match(/^\/portal\/([^/]+)/);
    return match ? match[1] : '';
  }

  function metric(row) {
    return '<div class="live-module-metric"><strong>' + row[0] + '</strong><b>' + row[1] + '</b><span>' + row[2] + '</span></div>';
  }

  function list(id, title) {
    var items = rows[id] || [];
    return '<article class="live-module-card"><h3>' + title + '</h3><div class="live-module-list">' + items.map(function (row) {
      return '<div class="live-module-row"><div><strong>' + row[0] + '</strong><span>' + row[1] + '</span></div><b>' + row[2] + '</b></div>';
    }).join('') + '</div></article>';
  }

  function form(id, title) {
    return '<article class="live-module-card"><h3>Add / update ' + title + '</h3><form class="live-module-form"><label>Name<input placeholder="Name" /></label><label>Type<select><option>Customer</option><option>Vendor</option><option>Employee</option><option>Approval</option></select></label><label>Email<input placeholder="email@company.com" /></label><label>Priority<select><option>Ready</option><option>Needs review</option><option>Proof required</option></select></label><label class="wide">Notes<textarea placeholder="Notes for Neroa routing"></textarea></label><button type="button">Save draft</button></form><div class="live-module-proof"><strong>Proof-ready path</strong><span>Production path: action captured -> Neroa Policy -> record write -> Proof/Audit event.</span></div></article>';
  }

  function build(id) {
    var d = data[id];
    return '<section class="live-module-shell" data-canonical-live="true"><article class="live-module-card"><p class="eyebrow">Canonical live module</p><h2>' + d[0] + '</h2><p>' + d[1] + '</p><div class="live-module-actions"><button type="button">New record</button><button type="button">Import</button><button type="button">Clean up</button><button type="button">Route to Neroa</button></div><div class="live-module-metrics">' + d[2].map(metric).join('') + '</div></article><aside class="live-module-card"><h3>Neroa control path</h3><div class="live-module-status-strip"><div class="live-module-step"><b>1</b><span>Capture or import the record.</span></div><div class="live-module-step"><b>2</b><span>Clean and classify with Neroa.</span></div><div class="live-module-step"><b>3</b><span>Link to accounting, jobs, messages, and approvals.</span></div><div class="live-module-step"><b>4</b><span>Write Proof/Audit event when it matters.</span></div></div></aside><div class="live-module-grid">' + d[3].map(function (title) { return list(id, title); }).join('') + form(id, d[0]) + '</div></section>';
  }

  function enhance() {
    var id = portalId();
    var d = data[id];
    var workspace = document.querySelector('.workspace');
    if (!workspace) return;
    document.querySelectorAll('[data-canonical-live]').forEach(function (node) { if (!d) node.remove(); });
    workspace.classList.toggle('live-portal-enhanced', !!d);
    if (!d || workspace.querySelector('[data-canonical-live]')) return;
    var placeholder = workspace.querySelector('.workspace-grid');
    if (placeholder) placeholder.classList.add('canonical-placeholder-hidden');
    var wrap = document.createElement('div');
    wrap.innerHTML = build(id);
    if (placeholder) placeholder.insertAdjacentElement('afterend', wrap.firstElementChild);
    else workspace.appendChild(wrap.firstElementChild);
  }

  window.addEventListener('load', enhance);
  window.addEventListener('popstate', function () { window.setTimeout(enhance, 120); });
  document.addEventListener('click', function () { window.setTimeout(enhance, 160); });
  if (document.readyState !== 'loading') enhance();
}());
