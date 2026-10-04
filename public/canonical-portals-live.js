(function () {
  if (window.__canonicalPortalsLive) return;
  window.__canonicalPortalsLive = true;

  var portals = {
    contacts: {
      title: 'Contacts / CRM',
      intro: 'Live company, people, customer, vendor, contractor, project contact, account history, cleanup, and accounting handoff lane.',
      metrics: [['Companies','128','Customer/vendor/contractor'], ['People','342','Contacts and approvers'], ['Cleanup','18','Duplicates/missing billing data'], ['Accounting link','Live','Feeds customers and vendors']],
      sections: [
        ['Customer accounts', [['Atlas Apparel','Billing email verified · portal enabled','Ready'], ['Apex Roofing','45 days past due · credit watch','Review'], ['River City Merch','Photo approval contact attached','Ready']]],
        ['Vendor accounts', [['Blank Shirt Supply','Terms and PO contact captured','Ready'], ['InkPro Distribution','Vendor API candidate','Connect'], ['Screen Room Supply','Missing W-9 / tax form','Need']]],
        ['Neroa cleanup queue', [['Duplicate companies','8 likely duplicates to merge','Fix'], ['Missing billing emails','6 customers need billing contact','Ask'], ['Vendor expense coding','4 vendors need default account','Code']]],
        ['Linked history', [['Quotes','Sales and estimating history rolls up here','Live'], ['Invoices/payments','AR and AP tie to company record','Live'], ['Messages','Neroa Connect threads attach here','Live']]]
      ]
    },
    hr: {
      title: 'HR Portal',
      intro: 'Live employees, onboarding, handbook, training, PTO, payroll prep, labor rates, and employee documents.',
      metrics: [['Employees','17','Active crew'], ['Training','4','Due'], ['PTO','2','Pending'], ['Payroll','91%','Ready']],
      sections: [
        ['Employee records', [['John Rivera','Press Lead · $25/hr','Active'], ['Maria Lane','Press Operator · $24/hr','Active'], ['Noah Ward','Runner · $16/hr','Active']]],
        ['Onboarding', [['New hire packet','W-4, I-9, handbook acknowledgement','Ready'], ['Safety checklist','Machine and shop safety basics','Live'], ['Document folder','Employee file storage and signatures','Drive']]],
        ['Payroll prep', [['Hourly rates','Feed Comptroller labor costing','Live'], ['Time approvals','Manager review before payroll','Gate'], ['Loaded labor','Burden estimate for daily report','Live']]],
        ['Training + PTO', [['Safety training','4 assignments due this week','Due'], ['PTO requests','2 requests awaiting approval','Pending'], ['Policy signoff','Handbook proof events captured','Proof']]]
      ]
    },
    vendor: {
      title: 'Vendor Portal',
      intro: 'Live vendor packets, PO visibility, due dates, upload slots, receiving status, AP bill connection, and vendor communication.',
      metrics: [['Packets','19','Open'], ['Uploads','5','Needed'], ['Late','3','Follow-up'], ['AP links','14','Bills ready']],
      sections: [
        ['Vendor packets', [['Blank Shirt Supply','PO-5001 confirm ship date','Open'], ['InkPro Distribution','Pricing confirmation needed','Need'], ['Screen Room Supply','Late delivery follow-up','Escalate']]],
        ['Upload requests', [['Invoice PDF','Route to AP bill','AP'], ['Packing slip','Attach to receiving','Upload'], ['Tax forms','Missing from 2 vendors','Need']]],
        ['Receiving', [['Dock check-in','8 deliveries expected today','Today'], ['Partial receive','2 POs short shipped','Review'], ['Cost coding','Post to job or inventory','Code']]],
        ['AP bill links', [['PO to bill','Vendor invoice becomes AP bill','Live'], ['Payment terms','Net terms and due dates controlled','Live'], ['Comptroller','Prioritize bills against cash','Live']]]
      ]
    },
    customer: {
      title: 'Customer Portal',
      intro: 'Live customer approvals, payments, documents, uploads, job status, photo approvals, and customer communication.',
      metrics: [['Approvals','11','Customer action'], ['Invoices','$27k','Open AR'], ['Uploads','6','Needed'], ['Threads','22','Active']],
      sections: [
        ['Approvals', [['Photo approval','JOB-24018 ready for customer','Send'], ['Quote approval','SCB-Q-1002 waiting approval','Send'], ['Change order','Apex Roofing revision','Review']]],
        ['Payments', [['Open invoices','Past due and current AR','Live'], ['Payment link','Send through portal','Ready'], ['Credit hold','Comptroller can recommend hold','Policy']]],
        ['Documents', [['Quote PDF','Customer-visible approved quote','Live'], ['Artwork files','Upload and proof assets','Live'], ['Closeout packet','Delivery docs + invoice + payment','Ready']]],
        ['Neroa Connect', [['Customer thread','Messages tied to job/account','Live'], ['Approval proof','Approval captured into Proof','Proof'], ['Support','Routes to team or AI','Live']]]
      ]
    },
    employee: {
      title: 'Employee Self-Service',
      intro: 'Live employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.',
      metrics: [['Training','4 due','Assignments'], ['PTO','2','Pending'], ['Docs','12','Files'], ['Help','Live','Neroa']],
      sections: [
        ['Profile', [['Personal info','Update contact and emergency info','Open'], ['Documents','Handbook and forms','Open'], ['Manager','Route requests to manager','Live']]],
        ['PTO', [['Request','Submit PTO request','Open'], ['Balance','Policy and available time','View'], ['Approval','Manager approval proof','Proof']]],
        ['Training', [['Safety training','Due this week','Due'], ['Machine basics','Assigned to press crew','Active'], ['Handbook','Acknowledgement required','Sign']]],
        ['HR help', [['Ask HR','Policy or setup question','Connect'], ['Support','Route to admin if needed','Live'], ['Proof','Acknowledgements recorded','Proof']]]
      ]
    }
  };

  function portalId() {
    var match = (location.pathname || '').match(/^\/portal\/([^/]+)/);
    return match ? match[1] : '';
  }

  function metric(row) {
    return '<div class="live-module-metric"><strong>' + row[0] + '</strong><b>' + row[1] + '</b><span>' + row[2] + '</span></div>';
  }

  function section(card) {
    return '<article class="live-module-card"><h3>' + card[0] + '</h3><div class="live-module-list">' + card[1].map(function (row) {
      return '<div class="live-module-row"><div><strong>' + row[0] + '</strong><span>' + row[1] + '</span></div><b>' + row[2] + '</b></div>';
    }).join('') + '</div></article>';
  }

  function form(title) {
    return '<article class="live-module-card"><h3>Add / update ' + title + '</h3><form class="live-module-form"><label>Name<input placeholder="Name" /></label><label>Type<select><option>Customer</option><option>Vendor</option><option>Employee</option><option>Approval</option></select></label><label>Email<input placeholder="email@company.com" /></label><label>Priority<select><option>Ready</option><option>Needs review</option><option>Proof required</option></select></label><label class="wide">Notes<textarea placeholder="Notes for Neroa routing"></textarea></label><button type="button">Save draft</button></form><div class="live-module-proof"><strong>Proof-ready path</strong><span>Action captured -> Neroa Policy -> record write -> Proof/Audit event.</span></div></article>';
  }

  function build(id) {
    var d = portals[id];
    return '<section class="live-module-shell" data-canonical-live="true" data-portal-id="' + id + '"><article class="live-module-card"><p class="eyebrow">Canonical live module</p><h2>' + d.title + '</h2><p>' + d.intro + '</p><div class="live-module-actions"><button type="button">New record</button><button type="button">Import</button><button type="button">Clean up</button><button type="button">Route to Neroa</button></div><div class="live-module-metrics">' + d.metrics.map(metric).join('') + '</div></article><aside class="live-module-card"><h3>Neroa control path</h3><div class="live-module-status-strip"><div class="live-module-step"><b>1</b><span>Capture or import the record.</span></div><div class="live-module-step"><b>2</b><span>Clean and classify with Neroa.</span></div><div class="live-module-step"><b>3</b><span>Link to accounting, jobs, messages, and approvals.</span></div><div class="live-module-step"><b>4</b><span>Write Proof/Audit event when it matters.</span></div></div></aside><div class="live-module-grid">' + d.sections.map(section).join('') + form(d.title) + '</div></section>';
  }

  function enhance() {
    var id = portalId();
    var d = portals[id];
    var workspace = document.querySelector('.workspace');
    if (!workspace) return;
    document.querySelectorAll('[data-canonical-live]').forEach(function (node) { if (!d || node.dataset.portalId !== id) node.remove(); });
    workspace.classList.toggle('live-portal-enhanced', !!d);
    if (!d) return;
    var placeholder = workspace.querySelector('.workspace-grid');
    if (placeholder) placeholder.style.display = 'none';
    if (workspace.querySelector('[data-canonical-live][data-portal-id="' + id + '"]')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = build(id);
    var header = workspace.querySelector('.workspace-header');
    if (header) header.insertAdjacentElement('afterend', wrap.firstElementChild);
    else workspace.prepend(wrap.firstElementChild);
  }

  function run() {
    var count = 0;
    enhance();
    var timer = window.setInterval(function () {
      enhance();
      count += 1;
      if (count >= 12) window.clearInterval(timer);
    }, 250);
  }

  window.addEventListener('load', run);
  window.addEventListener('popstate', run);
  document.addEventListener('click', function () { window.setTimeout(run, 120); });
  if (document.readyState !== 'loading') run();
}());
