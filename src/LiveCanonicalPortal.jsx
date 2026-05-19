import React from 'react';

const canonicalLiveData = {
  admin: {
    eyebrow: 'Canonical live module',
    title: 'Admin',
    intro: 'Tenant controls, users, roles, portal access, language, setup status, security posture, and customer-facing administration.',
    metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled for tenant'], ['Languages', '6', 'Available'], ['Setup', 'Open', 'Comptroller-guided']],
    actions: ['Invite user', 'Assign portals', 'Start setup', 'Review security'],
    sections: [
      ['User control', [['Seth McBride', 'Admin / Owner · all tenant controls', 'Owner'], ['Neroa Developer', 'Developer room and system setup', 'Dev'], ['Accounting User', 'Accounting + Contacts + Employee access', 'Ready']]],
      ['Portal access', [['Canonical core', 'Admin, Accounting, Contacts, HR, Vendor, Customer, Employee', 'Live'], ['Industry pack', 'Sales, Estimating, Projects, Planning, Purchasing', 'Live'], ['Permission map', 'Role-based portal assignment', 'Ready']]],
      ['Tenant setup', [['Start Setup', 'Guided customer/accounting/payroll/banking setup', 'Open'], ['Language', 'User language stored in database', 'Live'], ['Brand handoff', 'Steel Craft brand controls locked by developer', 'Ready']]],
      ['Security + proof', [['Authentication', 'Database-backed login users', 'Live'], ['Neroa Edge', 'Bank-level security foundation lane', 'Planned'], ['Audit trail', 'Admin changes should create proof/audit events', 'Proof']]]
    ],
    formTitle: 'Admin action'
  },
  contacts: {
    eyebrow: 'Canonical live module',
    title: 'Contacts / CRM',
    intro: 'Master company, people, customer, vendor, contractor, project contact, account history, cleanup, and accounting handoff lane.',
    metrics: [['Companies', '128', 'Customer / vendor / contractor'], ['People', '342', 'Contacts and approvers'], ['Cleanup', '18', 'Duplicates and missing billing info'], ['Accounting link', 'Live', 'Feeds customers and vendors']],
    actions: ['New company', 'Import list', 'Clean duplicates', 'Push to Accounting'],
    sections: [
      ['Customer accounts', [['Atlas Apparel', 'Billing email verified and portal enabled', 'Ready'], ['Apex Roofing', '45 days past due and credit watch', 'Review'], ['River City Merch', 'Photo approval contact attached', 'Ready']]],
      ['Vendor accounts', [['Blank Shirt Supply', 'Terms and PO contact captured', 'Ready'], ['InkPro Distribution', 'Vendor API candidate', 'Connect'], ['Screen Room Supply', 'Missing W-9 / tax form', 'Need']]],
      ['Neroa cleanup queue', [['Duplicate companies', '8 likely duplicates to merge', 'Fix'], ['Missing billing emails', '6 customers need billing contact', 'Ask'], ['Vendor expense coding', '4 vendors need default account', 'Code']]],
      ['Linked history', [['Quotes', 'Sales and estimating history rolls up here', 'Live'], ['Invoices / payments', 'AR and AP tie to company record', 'Live'], ['Messages', 'Neroa Connect threads attach here', 'Live']]]
    ],
    formTitle: 'Add / import contact'
  },
  hr: {
    eyebrow: 'Canonical live module',
    title: 'HR Portal',
    intro: 'Employees, onboarding, handbook, training, PTO, payroll prep connection, labor rates, and employee documents.',
    metrics: [['Employees', '17', 'Active crew'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Payroll', '91%', 'Ready']],
    actions: ['Add employee', 'Assign training', 'Review PTO', 'Open payroll prep'],
    sections: [
      ['Employee records', [['John Rivera', 'Press Lead · $25/hr', 'Active'], ['Maria Lane', 'Press Operator · $24/hr', 'Active'], ['Noah Ward', 'Runner · $16/hr', 'Active']]],
      ['Onboarding', [['New hire packet', 'W-4, I-9, handbook acknowledgement', 'Ready'], ['Safety checklist', 'Machine and shop safety basics', 'Live'], ['Document folder', 'Employee file storage and signatures', 'Drive']]],
      ['Payroll prep', [['Hourly rates', 'Feed Comptroller labor costing', 'Live'], ['Time approvals', 'Manager review before payroll', 'Gate'], ['Loaded labor', 'Burden estimate for daily report', 'Live']]],
      ['Training + PTO', [['Safety training', '4 assignments due this week', 'Due'], ['PTO requests', '2 requests awaiting approval', 'Pending'], ['Policy signoff', 'Handbook proof events captured', 'Proof']]]
    ],
    formTitle: 'Add employee'
  },
  vendor: {
    eyebrow: 'Canonical live module',
    title: 'Vendor Portal',
    intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, AP bill connection, and vendor communication.',
    metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Bills ready']],
    actions: ['Send vendor packet', 'Request upload', 'Confirm due date', 'Open AP bill'],
    sections: [
      ['Vendor packets', [['Blank Shirt Supply', 'PO-5001 confirm ship date', 'Open'], ['InkPro Distribution', 'Pricing confirmation needed', 'Need'], ['Screen Room Supply', 'Late delivery follow-up', 'Escalate']]],
      ['Upload requests', [['Invoice PDF', 'Route to AP bill', 'AP'], ['Packing slip', 'Attach to receiving', 'Upload'], ['Tax forms', 'Missing from 2 vendors', 'Need']]],
      ['Receiving', [['Dock check-in', '8 deliveries expected today', 'Today'], ['Partial receive', '2 POs short shipped', 'Review'], ['Cost coding', 'Post to job or inventory', 'Code']]],
      ['AP bill links', [['PO to bill', 'Vendor invoice becomes AP bill', 'Live'], ['Payment terms', 'Net terms and due dates controlled', 'Live'], ['Comptroller', 'Prioritize bills against cash', 'Live']]]
    ],
    formTitle: 'Create vendor packet'
  },
  customer: {
    eyebrow: 'Canonical live module',
    title: 'Customer Portal',
    intro: 'Customer approvals, payments, documents, uploads, job status, photo approvals, and customer communication.',
    metrics: [['Approvals', '11', 'Customer action'], ['Invoices', '$27k', 'Open AR'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']],
    actions: ['Send approval', 'Request payment', 'Upload document', 'Open customer thread'],
    sections: [
      ['Approvals', [['Photo approval', 'JOB-24018 ready for customer', 'Send'], ['Quote approval', 'SCB-Q-1002 waiting approval', 'Send'], ['Change order', 'Apex Roofing revision', 'Review']]],
      ['Payments', [['Open invoices', 'Past due and current AR', 'Live'], ['Payment link', 'Send through portal', 'Ready'], ['Credit hold', 'Comptroller can recommend hold', 'Policy']]],
      ['Documents', [['Quote PDF', 'Customer-visible approved quote', 'Live'], ['Artwork files', 'Upload and proof assets', 'Live'], ['Closeout packet', 'Delivery docs + invoice + payment', 'Ready']]],
      ['Neroa Connect', [['Customer thread', 'Messages tied to job/account', 'Live'], ['Approval proof', 'Approval captured into Proof', 'Proof'], ['Support', 'Routes to team or AI', 'Live']]]
    ],
    formTitle: 'Customer request'
  },
  employee: {
    eyebrow: 'Canonical live module',
    title: 'Employee Self-Service',
    intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.',
    metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Neroa']],
    actions: ['Request PTO', 'Open training', 'Acknowledge handbook', 'Ask HR'],
    sections: [
      ['Profile', [['Personal info', 'Update contact and emergency info', 'Open'], ['Documents', 'Handbook and forms', 'Open'], ['Manager', 'Route requests to manager', 'Live']]],
      ['PTO', [['Request', 'Submit PTO request', 'Open'], ['Balance', 'Policy and available time', 'View'], ['Approval', 'Manager approval proof', 'Proof']]],
      ['Training', [['Safety training', 'Due this week', 'Due'], ['Machine basics', 'Assigned to press crew', 'Active'], ['Handbook', 'Acknowledgement required', 'Sign']]],
      ['HR help', [['Ask HR', 'Policy or setup question', 'Connect'], ['Support', 'Route to admin if needed', 'Live'], ['Proof', 'Acknowledgements recorded', 'Proof']]]
    ],
    formTitle: 'Employee request'
  }
};

function Metric({ row }) {
  return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>;
}

function LiveSection({ section }) {
  return <article className="live-module-card"><h3>{section[0]}</h3><div className="live-module-list">{section[1].map((row) => <div className="live-module-row" key={`${section[0]}-${row[0]}`}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article>;
}

export function isLiveCanonicalPortal(id) {
  return Boolean(canonicalLiveData[id]);
}

export default function LiveCanonicalPortal({ id, Header }) {
  const data = canonicalLiveData[id];
  if (!data) return null;
  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live">
      <article className="live-module-card">
        <p className="eyebrow">{data.eyebrow}</p>
        <h2>{data.title}</h2>
        <p>{data.intro}</p>
        <div className="live-module-actions">{data.actions.map((action) => <button type="button" key={action}>{action}</button>)}</div>
        <div className="live-module-metrics">{data.metrics.map((row) => <Metric row={row} key={row[0]} />)}</div>
      </article>
      <aside className="live-module-card">
        <h3>Neroa control path</h3>
        <div className="live-module-status-strip">
          <div className="live-module-step"><b>1</b><span>Capture or import the record.</span></div>
          <div className="live-module-step"><b>2</b><span>Clean and classify with Neroa.</span></div>
          <div className="live-module-step"><b>3</b><span>Link to accounting, jobs, messages, and approvals.</span></div>
          <div className="live-module-step"><b>4</b><span>Write Proof/Audit event when it matters.</span></div>
        </div>
      </aside>
      <div className="live-module-grid">
        {data.sections.map((section) => <LiveSection section={section} key={section[0]} />)}
        <article className="live-module-card">
          <h3>{data.formTitle}</h3>
          <form className="live-module-form">
            <label>Name<input placeholder="Name" /></label>
            <label>Type<select><option>Customer</option><option>Vendor</option><option>Employee</option><option>Approval</option></select></label>
            <label>Email<input placeholder="email@company.com" /></label>
            <label>Priority<select><option>Ready</option><option>Needs review</option><option>Proof required</option></select></label>
            <label className="wide">Notes<textarea placeholder="Notes for Neroa routing"></textarea></label>
            <button type="button">Save draft</button>
          </form>
          <div className="live-module-proof"><strong>Proof-ready path</strong><span>Action captured -> Neroa Policy -> record write -> Proof/Audit event.</span></div>
        </article>
      </div>
    </section>
  </>;
}
