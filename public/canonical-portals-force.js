(function () {
  if (window.__canonicalPortalsForceLive) return;
  window.__canonicalPortalsForceLive = true;

  var liveData = {
    contacts: {
      title: 'Contacts / CRM',
      intro: 'Live customer, vendor, people, import cleanup, linked history, and accounting handoff center. This is the first setup lane before accounting.',
      metrics: [['Companies', '128', 'Customers, vendors, contractors'], ['People', '342', 'Contacts and approvers'], ['Cleanup queue', '18', 'Duplicates and missing billing info'], ['Accounting link', 'Live', 'Customers and vendors feed setup']],
      sections: [
        ['Customer accounts', [['Atlas Apparel', 'Customer account verified · billing email attached', 'Ready'], ['Apex Roofing', '45 days past due · credit watch', 'Review'], ['River City Merch', 'Photo approvals enabled', 'Ready']]],
        ['Vendor accounts', [['Blank Shirt Supply', 'Terms captured · PO contact ready', 'Ready'], ['InkPro Distribution', 'Vendor API candidate', 'Connect'], ['Screen Room Supply', 'Missing tax form', 'Need']]],
        ['Neroa cleanup queue', [['Duplicate company names', '8 likely duplicates found', 'Fix'], ['Missing billing emails', '6 customers need billing contact', 'Ask'], ['Vendor categories', '4 vendors need expense account', 'Code']]],
        ['Linked history', [['Quotes', 'Sales and estimating history attaches here', 'Live'], ['Invoices', 'AR/AP roll up to company record', 'Live'], ['Messages', 'Neroa Connect threads attach to contacts', 'Live']]]
      ],
      formTitle: 'Add / import contact'
    },
    hr: {
      title: 'HR Portal', intro: 'Live employee records, onboarding, handbook, PTO, training, and payroll prep lane.', metrics: [['Employees','17','Active'],['Training','4','Due'],['PTO','2','Pending'],['Payroll','91%','Ready']], sections: [['Employee records',[['John Rivera','Press Lead · $25/hr','Active'],['Maria Lane','Press Operator · $24/hr','Active'],['Noah Ward','Runner · $16/hr','Active']]],['Payroll prep',[['Hourly rates','Feed Comptroller labor cost','Live'],['Time approvals','Manager review before payroll','Gate'],['Loaded labor','Burden estimate for daily report','Live']]],['Training',[['Safety','Due this week','Due'],['Machine basics','Assigned to press crew','Active'],['Handbook','Acknowledgement needed','Sign']]],['Documents',[['Employee files','W-4, I-9, handbook','Drive'],['Policy proof','Acknowledgements captured','Proof'],['HR Help','Neroa routes questions','Live']]]], formTitle: 'Add employee'
    },
    vendor: {
      title: 'Vendor Portal', intro: 'Live vendor packets, PO visibility, upload slots, due dates, receiving, bill routing, and vendor communication.', metrics: [['Packets','19','Open'],['Uploads','5','Needed'],['Late','3','Follow-up'],['AP bills','14','Linked']], sections: [['Vendor packets',[['Blank Shirt Supply','PO-5001 confirm ship date','Open'],['InkPro Distribution','Pricing confirmation','Need'],['Screen Room Supply','Late delivery','Escalate']]],['Uploads',[['Invoice PDF','Route to AP bill','AP'],['Packing slip','Attach to receiving','Upload'],['Tax forms','Missing from 2 vendors','Need']]],['Receiving',[['Dock check-in','8 deliveries expected','Today'],['Partial receive','2 POs short shipped','Review'],['Cost coding','Post to job or inventory','Code']]],['Communication',[['Vendor thread','Tied to PO/vendor','Live'],['Reminders','Due-date follow-up','Planned'],['Proof','Vendor confirmation anchor','Proof']]]], formTitle: 'Create vendor packet'
    },
    customer: {
      title: 'Customer Portal', intro: 'Live customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals','11','Customer action'],['Open AR','$27k','Invoices'],['Uploads','6','Needed'],['Threads','22','Active']], sections: [['Approvals',[['Photo approval','JOB-24018 ready','Send'],['Quote approval','SCB-Q-1002','Send'],['Change order','Apex revision','Review']]],['Payments',[['Open invoices','Past due and current AR','Live'],['Payment link','Send through portal','Ready'],['Credit hold','Comptroller recommendation','Policy']]],['Documents',[['Quote PDF','Customer visible','Live'],['Artwork files','Upload and proof','Live'],['Closeout packet','Delivery + invoice + payment','Ready']]],['Neroa Connect',[['Customer thread','Messages tied to job/account','Live'],['Approval proof','Captured into Proof','Proof'],['Support','Routes to team or AI','Live']]]], formTitle: 'Customer request'
    },
    employee: {
      title: 'Employee Self-Service', intro: 'Live employee profile, PTO requests, training assignments, handbook acknowledgement, documents, and HR help.', metrics: [['Training','4 due','Assignments'],['PTO','2','Pending'],['Docs','12','Files'],['Help','Live','Neroa']], sections: [['Profile',[['Personal info','Update contact and emergency info','Open'],['Documents','Handbook and forms','Open'],['Manager','Route requests to manager','Live']]],['PTO',[['Request','Submit PTO request','Open'],['Balance','Policy and available time','View'],['Approval','Manager approval proof','Proof']]],['Training',[['Safety training','Due this week','Due'],['Machine basics','Assigned to press crew','Active'],['Handbook','Acknowledgement required','Sign']]],['Neroa Help',[['Ask HR','Policy or setup question','Connect'],['Support','Route to admin if needed','Live'],['Proof','Acknowledgements recorded','Proof']]]], formTitle: 'Employee request'
    }
  };

  function portalId() {
    var m = (location.pathname || '').match(/^\/portal\/([^/]+)/);
    return m ? m[1] : '';
  }

  function metric(row) {
    return '<div class="live-module-metric"><strong>' + row[0] + '</strong><b>' + row[1] + '</b><span>' + row[2] + '</span></div>';
  }

  function section(item) {
    return '<article class="live-module-card"><h3>' + item[0] + '</h3><div class="live-module-list">' + item[1].map(function (row) {
      return '<div class="live-module-row"><div><strong>' + row[0] + '</strong><span>' + row[1] + '</span></div><b>' + row[2] + '</b></div>';
    }).join('') + '</div></article>';
  }

  function build(id, data) {
    return '<section class="live-module-shell canonical-force-live" data-canonical-force-live="true">' +
      '<article class="live-module-card"><p class="eyebrow">Canonical live module</p><h2>' + data.title + '</h2><p>' + data.intro + '</p><div class="live-module-actions"><button type="button">New record</button><button type="button">Import</button><button type="button">Clean up</button><button type="button">Route to Neroa</button></div><div class="live-module-metrics">' + data.metrics.map(metric).join('') + '</div></article>' +
      '<aside class="live-module-card"><h3>Neroa control path</h3><div class="live-module-status-strip"><div class="live-module-step"><b>1</b><span>Capture/import record.</span></div><div class="live-module-step"><b>2</b><span>Clean and classify.</span></div><div class="live-module-step"><b>3</b><span>Link to accounting, jobs, messages, approvals.</span></div><div class="live-module-step"><b>4</b><span>Write Proof/Audit when needed.</span></div></div></aside>' +
      '<div class="live-module-grid">' + data.sections.map(section).join('') +
      '<article class="live-module-card"><h3>' + data.formTitle + '</h3><form class="live-module-form"><label>Name<input placeholder="Name" /></label><label>Type<select><option>Customer</option><option>Vendor</option><option>Employee</option><option>Approval</option></select></label><label>Email<input placeholder="email@company.com" /></label><label>Priority<select><option>Ready</option><option>Needs review</option><option>Proof required</option></select></label><label class="wide">Notes<textarea placeholder="Notes for Neroa routing"></textarea></label><button type="button">Save draft</button></form><div class="live-module-proof"><strong>Proof-ready path</strong><span>Action captured -> Neroa Policy -> record write -> Proof/Audit event.</span></div></article>' +
      '</div></section>';
  }

  function enhance() {
    var id = portalId();
    var data = liveData[id];
    var workspace = document.querySelector('.workspace');
    if (!workspace) return;
    document.querySelectorAll('[data-canonical-force-live="true"]').forEach(function (node) { if (!data || node.dataset.portalId !== id) node.remove(); });
    if (!data) return;
    workspace.classList.add('live-portal-enhanced');
    var old = workspace.querySelector('.workspace-grid');
    if (old) old.style.display = 'none';
    if (workspace.querySelector('[data-canonical-force-live="true"]')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = build(id, data);
    wrap.firstElementChild.dataset.portalId = id;
    var header = workspace.querySelector('.workspace-header');
    if (header) header.insertAdjacentElement('afterend', wrap.firstElementChild);
    else workspace.prepend(wrap.firstElementChild);
  }

  function runRepeated() {
    var count = 0;
    enhance();
    var timer = window.setInterval(function () {
      enhance();
      count += 1;
      if (count > 12) window.clearInterval(timer);
    }, 250);
  }

  window.addEventListener('load', runRepeated);
  window.addEventListener('popstate', runRepeated);
  document.addEventListener('click', function () { window.setTimeout(runRepeated, 100); });
  if (document.readyState !== 'loading') runRepeated();
}());
