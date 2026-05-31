import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiSend } from './api.js';
import CrmWebsiteIntelligence from './CrmWebsiteIntelligence.jsx';

const fallback = {
  employees: [
    {
      id: 1,
      name: 'Avery Taylor',
      title: 'Project Manager',
      department: 'Operations',
      manager: 'Seth Farrell',
      employmentType: 'Salary',
      startDate: '2024-01-08',
      ptoBalance: 88,
      status: 'Active',
    },
  ],
  ptoRequests: [],
  supportRequests: [],
  handbook: {
    id: 1,
    version: '2026.1',
    effectiveDate: '2026-05-13',
    title: 'Steel Craft Employee Handbook',
    acknowledgedBy: [],
  },
  training: [],
};

const defaultBrand = {
  platformName: 'White Label Operations Portal',
  tenantName: 'New Customer',
  tenantSlug: 'new-customer',
  primaryColor: '#172033',
  accentColor: '#bb2e2e',
  logoUrl: '',
  customDomain: '',
  supportEmail: '',
  loadSteelCraftData: false,
  loadMondayBoards: false,
  loadExcelWorkbook: false,
  templateMode: 'clean-structure',
  enabledPortals: ['admin', 'employee', 'accounting', 'vendor', 'customer'],
  employeeModules: ['sales', 'projects', 'planning', 'hr', 'accounts', 'contacts', 'crm', 'erection'],
};

const topPortals = [
  { id: 'admin', title: 'Admin Portal', audience: 'Owner / system admin', purpose: 'Users, roles, permissions, database status, integrations, schema setup, audit controls, and global settings.' },
  { id: 'employee', title: 'Employee Portal', audience: 'Internal Steel Craft team', purpose: 'Internal operations for sales, estimating, projects, planning, HR, accounts, contacts, CRM, and erection schedule.' },
  { id: 'accounting', title: 'Accounting Portal', audience: 'Accounting / finance team', purpose: 'Full financial control center for billing, insurance, POs, invoices, SOV, payments, vendor bills, receivables, payables, and reporting.' },
  { id: 'vendor', title: 'Vendor Portal', audience: 'Outside vendors', purpose: 'External vendor access for assigned project packages, PO visibility, due dates, uploads, and vendor packet status.' },
  { id: 'customer', title: 'Customer Portal', audience: 'Outside customers', purpose: 'External customer access for approved project status, documents, quotes, contracts, change orders, payments, approvals, and uploads.' },
];

const employeeModules = [
  { id: 'sales', title: 'Sales & Estimating', description: 'Estimate intake, scope builder, cost build, margin review, quote generator, and project checklist.' },
  { id: 'projects', title: 'Project Portal', description: 'Contracted jobs, engineering, material, fabrication, delivery, erection, punch, and closeout.' },
  { id: 'planning', title: 'Planning Portal', description: 'Internal job readiness, planning schedule, handoffs, internal execution, and readiness checks.' },
  { id: 'hr', title: 'HR Portal', description: 'Salary employee records, PTO, handbook, HR support, onboarding, and training modules.' },
  { id: 'accounts', title: 'Accounts', description: 'Customer, vendor, contractor, and company account records. Financial transactions live in Accounting.' },
  { id: 'contacts', title: 'Contacts', description: 'People tied to customers, vendors, contractors, internal teams, jobs, and estimates.' },
  { id: 'crm', title: 'CRM Website Intelligence', description: 'Public website crawl, lead scoring, SEO/trust/conversion scoring, outreach recommendations, and access-gated optimization.' },
  { id: 'erection', title: 'Erection Schedule', description: 'Crew planning, erection dates, field readiness, milestones, and schedule conflicts.' },
];

const planningModules = [
  { title: 'Job Readiness', detail: 'Checklist before fabrication, delivery, erection, and closeout.' },
  { title: 'Internal Schedule', detail: 'Internal planning dates, dependencies, and readiness blockers.' },
  { title: 'Project Handoffs', detail: 'Sales-to-project, project-to-field, and closeout handoff steps.' },
  { title: 'Planning Notes', detail: 'Internal coordination notes before work moves into production or field execution.' },
];

const accountingModules = [
  { title: 'Billing', detail: 'Invoices, deposits, draws, billing status, and collection visibility.' },
  { title: 'Insurance', detail: 'COIs, insurance requirements, expiration tracking, and compliance checks.' },
  { title: 'Purchase Orders', detail: 'PO creation, vendor assignment, approvals, due dates, and internal PO management.' },
  { title: 'Accounts Receivable', detail: 'Customer invoices, open balances, payments received, aging, and follow-up.' },
  { title: 'Accounts Payable', detail: 'Vendor bills, subcontractor invoices, approvals, due dates, and payments.' },
  { title: 'Schedule of Values', detail: 'Material SOV, labor SOV, draw schedule, progress billing, and contract values.' },
  { title: 'Change Order Billing', detail: 'Approved change orders, pending billing, margin impact, and billing status.' },
  { title: 'Financial Reports', detail: 'Revenue, cost, margin, open AR/AP, project financial health, and exports.' },
];

function employeeName(data, id) {
  return data.employees.find((employee) => employee.id === Number(id))?.name || 'Unknown employee';
}

function anniversary(startDate) {
  const date = new Date(`${String(startDate).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function readBrand() {
  try {
    return JSON.parse(window.localStorage.getItem('steelcraft_brand_controls_v1')) || defaultBrand;
  } catch {
    return defaultBrand;
  }
}

function saveBrand(next) {
  window.localStorage.setItem('steelcraft_brand_controls_v1', JSON.stringify(next));
}

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function App() {
  const [data, setData] = useState(fallback);
  const [status, setStatus] = useState('Connecting to DigitalOcean PostgreSQL...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePortal, setActivePortal] = useState('employee');
  const [activeEmployeeModule, setActiveEmployeeModule] = useState('crm');
  const [activeEmployeeId, setActiveEmployeeId] = useState(1);
  const isBrandRoute = window.location.pathname.replace(/\/$/, '') === '/brand';

  async function refresh() {
    try {
      const next = await apiGet('/api/hr');
      setData(next);
      setStatus(next.employees?.length ? 'Connected to DigitalOcean PostgreSQL' : 'Backend connected. Add employees to begin.');
      if (next.employees?.length && !next.employees.some((employee) => employee.id === Number(activeEmployeeId))) {
        setActiveEmployeeId(next.employees[0].id);
      }
    } catch (error) {
      setStatus(`Backend not ready: ${error.message}`);
      setData(fallback);
    }
  }

  useEffect(() => { refresh(); }, []);
  if (isBrandRoute) return <BrandControls status={status} />;

  const activeEmployee = data.employees.find((employee) => employee.id === Number(activeEmployeeId)) || data.employees[0];
  const employeeTraining = useMemo(() => data.training.filter((course) => course.assignedTo?.includes(activeEmployee?.id)), [data.training, activeEmployee?.id]);
  const completedTraining = employeeTraining.filter((course) => course.completedBy?.includes(activeEmployee?.id)).length;
  const pendingPto = data.ptoRequests.filter((request) => request.status === 'Pending').length;
  const openSupport = data.supportRequests.filter((request) => request.status !== 'Resolved').length;

  async function submitPto(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiSend('/api/hr/pto/requests', 'POST', {
      employeeId: Number(form.get('employeeId')),
      type: form.get('type'),
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      hours: Number(form.get('hours')),
      reason: form.get('reason'),
    });
    event.currentTarget.reset();
    await refresh();
  }

  async function submitSupport(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiSend('/api/hr/concerns', 'POST', {
      employeeId: Number(form.get('employeeId')),
      category: form.get('category'),
      summary: form.get('summary'),
    });
    event.currentTarget.reset();
    await refresh();
  }

  async function setPtoStatus(id, statusValue) {
    await apiSend(`/api/hr/pto/requests/${id}/${statusValue === 'Approved' ? 'approve' : 'deny'}`, 'POST', {});
    await refresh();
  }

  async function resolveSupport(id) {
    await apiSend(`/api/hr/concerns/${id}`, 'PATCH', { status: 'Resolved', resolution: 'Resolved by HR Admin' });
    await refresh();
  }

  async function acknowledgeHandbook() {
    await apiSend('/api/hr/handbook/acknowledge', 'POST', { employeeId: activeEmployee.id });
    await refresh();
  }

  async function completeTraining(courseId) {
    await apiSend(`/api/hr/training/assignments/${courseId}/complete`, 'PATCH', { employeeId: activeEmployee.id });
    await refresh();
  }

  async function addTraining(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiSend('/api/hr/training/modules', 'POST', {
      title: form.get('title'),
      category: form.get('category'),
      lessons: String(form.get('lessons')).split('\n').map((lesson) => lesson.trim()).filter(Boolean),
    });
    event.currentTarget.reset();
    await refresh();
  }

  if (!isAuthenticated) return <AuthLanding onEnter={() => setIsAuthenticated(true)} status={status} />;

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <Badge tone="red">Five-portal architecture</Badge>
          <h1>Steel Craft Portal Gateway</h1>
          <p>Authenticated entry into five portals: Admin, Employee, Accounting, Vendor, and Customer. Accounting is now its own full financial portal.</p>
          <p className="connection-status">{status}</p>
        </div>
        <aside className="hero-panel">
          <span>Signed in view</span>
          <strong>{topPortals.find((portal) => portal.id === activePortal)?.title}</strong>
          <small>Architecture-first portal shell</small>
        </aside>
      </header>

      <PortalSwitcher activePortal={activePortal} setActivePortal={setActivePortal} />
      {activePortal === 'admin' && <AdminPortal data={data} status={status} pendingPto={pendingPto} openSupport={openSupport} />}
      {activePortal === 'employee' && (
        <EmployeePortal
          data={data}
          activeEmployee={activeEmployee}
          activeEmployeeId={activeEmployeeId}
          setActiveEmployeeId={setActiveEmployeeId}
          activeModule={activeEmployeeModule}
          setActiveModule={setActiveEmployeeModule}
          completedTraining={completedTraining}
          employeeTraining={employeeTraining}
          pendingPto={pendingPto}
          submitPto={submitPto}
          setPtoStatus={setPtoStatus}
          submitSupport={submitSupport}
          resolveSupport={resolveSupport}
          acknowledgeHandbook={acknowledgeHandbook}
          completeTraining={completeTraining}
          addTraining={addTraining}
        />
      )}
      {activePortal === 'accounting' && <AccountingPortal />}
      {activePortal === 'vendor' && <ExternalPortal type="Vendor" />}
      {activePortal === 'customer' && <ExternalPortal type="Customer" />}
    </main>
  );
}

function BrandControls({ status }) {
  const [brand, setBrand] = useState(readBrand);

  function updateField(field, value) {
    const next = { ...brand, [field]: value };
    setBrand(next);
    saveBrand(next);
  }

  function toggleArray(field, value) {
    const exists = brand[field].includes(value);
    const next = { ...brand, [field]: exists ? brand[field].filter((item) => item !== value) : [...brand[field], value] };
    setBrand(next);
    saveBrand(next);
  }

  function resetCleanTemplate() {
    setBrand(defaultBrand);
    saveBrand(defaultBrand);
  }

  return (
    <main className="app-shell brand-shell" style={{ '--brand-primary': brand.primaryColor, '--brand-accent': brand.accentColor }}>
      <header className="hero">
        <div>
          <Badge tone="red">Hidden /brand controls</Badge>
          <h1>White-label brand controls</h1>
          <p>This area is intentionally not linked from the customer-facing app. New tenants get the five-portal shell without Steel Craft Monday boards, Excel workbook data, or Steel Craft records.</p>
          <p className="connection-status">{status}</p>
        </div>
        <aside className="hero-panel brand-preview">
          <span>Tenant preview</span>
          <strong>{brand.tenantName}</strong>
          <small>{brand.platformName}</small>
          <div className="brand-swatch-row"><i style={{ background: brand.primaryColor }} /><i style={{ background: brand.accentColor }} /></div>
        </aside>
      </header>

      <div className="two-column wide-left">
        <Card>
          <div className="section-heading"><Badge>Tenant identity</Badge><h2>Main controls</h2></div>
          <div className="form-grid">
            <Field label="Platform name"><input value={brand.platformName} onChange={(event) => updateField('platformName', event.target.value)} /></Field>
            <Field label="Tenant/customer name"><input value={brand.tenantName} onChange={(event) => updateField('tenantName', event.target.value)} /></Field>
            <Field label="Tenant slug"><input value={brand.tenantSlug} onChange={(event) => updateField('tenantSlug', event.target.value)} /></Field>
            <Field label="Logo URL"><input value={brand.logoUrl} onChange={(event) => updateField('logoUrl', event.target.value)} /></Field>
            <Field label="Custom domain"><input value={brand.customDomain} onChange={(event) => updateField('customDomain', event.target.value)} /></Field>
            <Field label="Support email"><input value={brand.supportEmail} onChange={(event) => updateField('supportEmail', event.target.value)} /></Field>
            <Field label="Primary color"><input type="color" value={brand.primaryColor} onChange={(event) => updateField('primaryColor', event.target.value)} /></Field>
            <Field label="Accent color"><input type="color" value={brand.accentColor} onChange={(event) => updateField('accentColor', event.target.value)} /></Field>
          </div>
        </Card>

        <Card>
          <div className="section-heading"><Badge tone="green">Clean tenant template</Badge><h2>New customer data rules</h2><p>These must stay off when opening the platform for a new customer.</p></div>
          <div className="stack">
            <label className="check-row"><input type="checkbox" checked={brand.loadSteelCraftData} onChange={(event) => updateField('loadSteelCraftData', event.target.checked)} /> Load Steel Craft records</label>
            <label className="check-row"><input type="checkbox" checked={brand.loadMondayBoards} onChange={(event) => updateField('loadMondayBoards', event.target.checked)} /> Load Steel Craft Monday boards</label>
            <label className="check-row"><input type="checkbox" checked={brand.loadExcelWorkbook} onChange={(event) => updateField('loadExcelWorkbook', event.target.checked)} /> Load Steel Craft Excel workbook/platform data</label>
          </div>
          <div className="warning-box">Default for new customers: five-portal structure only. No Steel Craft board data, no Steel Craft Excel data, no Steel Craft records.</div>
          <button className="primary" onClick={resetCleanTemplate}>Reset to clean customer template</button>
        </Card>
      </div>

      <div className="two-column">
        <Card>
          <div className="section-heading"><Badge>Enabled portals</Badge><h2>Five-portal shell</h2></div>
          <div className="stack">
            {topPortals.map((portal) => (
              <label className="check-row" key={portal.id}><input type="checkbox" checked={brand.enabledPortals.includes(portal.id)} onChange={() => toggleArray('enabledPortals', portal.id)} /> {portal.title}</label>
            ))}
          </div>
        </Card>
        <Card>
          <div className="section-heading"><Badge>Employee modules</Badge><h2>Internal modules</h2></div>
          <div className="stack">
            {employeeModules.map((module) => (
              <label className="check-row" key={module.id}><input type="checkbox" checked={brand.employeeModules.includes(module.id)} onChange={() => toggleArray('employeeModules', module.id)} /> {module.title}</label>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function AuthLanding({ onEnter, status }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Badge tone="red">Authentication page</Badge>
        <h1>Steel Craft Operations Portal</h1>
        <p>This is the outside login gateway. After authentication, users are routed into one of five portals based on role: Admin, Employee, Accounting, Vendor, or Customer.</p>
        <div className="portal-grid landing-grid">{topPortals.map((portal) => <PortalSummary key={portal.id} portal={portal} />)}</div>
        <p className="connection-status">{status}</p>
        <button className="primary auth-button" onClick={onEnter}>Enter portal preview</button>
      </section>
    </main>
  );
}

function PortalSwitcher({ activePortal, setActivePortal }) {
  return <nav className="portal-tabs">{topPortals.map((portal) => <button key={portal.id} className={activePortal === portal.id ? 'active' : ''} onClick={() => setActivePortal(portal.id)}>{portal.title}</button>)}</nav>;
}

function PortalSummary({ portal }) {
  return <article className="portal-card"><Badge>{portal.audience}</Badge><h3>{portal.title}</h3><p>{portal.purpose}</p></article>;
}

function AdminPortal({ data, status, pendingPto, openSupport }) {
  return (
    <Card>
      <div className="section-heading"><Badge>Admin Portal</Badge><h2>System control center</h2><p>Admin owns users, roles, permissions, integrations, schema setup, audit logs, and global controls.</p></div>
      <div className="stats-grid">
        <div className="stat"><span>Database</span><strong>{status.includes('Connected') ? 'Online' : 'Check'}</strong><small>{status}</small></div>
        <div className="stat"><span>Employees</span><strong>{data.employees.length}</strong><small>User setup source</small></div>
        <div className="stat"><span>Pending PTO</span><strong>{pendingPto}</strong><small>Employee portal workflow</small></div>
        <div className="stat"><span>Open HR Support</span><strong>{openSupport}</strong><small>HR admin review</small></div>
      </div>
    </Card>
  );
}

function AccountingPortal() {
  return (
    <Card>
      <div className="section-heading"><Badge>Accounting Portal</Badge><h2>Full financial control center</h2><p>Accounting is now a top-level portal. Billing, insurance, POs, AR, AP, SOV, change order billing, and financial reporting live here.</p></div>
      <div className="module-grid four-up">{accountingModules.map((module) => <article className="module" key={module.title}><Badge tone="green">Accounting</Badge><h3>{module.title}</h3><p>{module.detail}</p></article>)}</div>
    </Card>
  );
}

function EmployeePortal(props) {
  const { activeEmployee, activeEmployeeId, setActiveEmployeeId, data, activeModule, setActiveModule, completedTraining, employeeTraining, pendingPto } = props;
  const selectedModule = employeeModules.find((module) => module.id === activeModule);

  return (
    <>
      <Card>
        <div className="section-heading"><Badge>Employee Portal</Badge><h2>Internal operating portal</h2><p>Sales & Estimating, Project Portal, Planning, HR, Accounts, Contacts, CRM Website Intelligence, and Erection Schedule live here. Financial control lives in Accounting.</p></div>
        <div className="employee-context">
          <Field label="Active employee"><select value={activeEmployeeId} onChange={(event) => setActiveEmployeeId(Number(event.target.value))}>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field>
          <div><span>Role</span><strong>{activeEmployee?.title}</strong></div>
          <div><span>Department</span><strong>{activeEmployee?.department}</strong></div>
          <div><span>Employment</span><strong>{activeEmployee?.employmentType}</strong></div>
        </div>
      </Card>
      <nav className="room-tabs module-tabs">{employeeModules.map((module) => <button key={module.id} className={activeModule === module.id ? 'active' : ''} onClick={() => setActiveModule(module.id)}>{module.title}</button>)}</nav>
      {activeModule === 'planning' && <PlanningPortal />}
      {activeModule === 'hr' && <HrPortal {...props} completedTraining={completedTraining} employeeTraining={employeeTraining} pendingPto={pendingPto} />}
      {activeModule === 'crm' && <CrmWebsiteIntelligence />}
      {activeModule !== 'planning' && activeModule !== 'hr' && activeModule !== 'crm' && <EmployeeModule module={selectedModule} />}
    </>
  );
}

function EmployeeModule({ module }) {
  return <Card><div className="section-heading"><Badge>Employee Module</Badge><h2>{module.title}</h2><p>{module.description}</p></div><div className="placeholder-box">This module is correctly placed inside the Employee Portal. Next step is building its database-backed workflow screens.</div></Card>;
}

function PlanningPortal() {
  return <Card><div className="section-heading"><Badge>Planning Portal</Badge><h2>Internal job planning</h2><p>Planning remains inside Employee, but financial control has moved to the Accounting Portal.</p></div><div className="module-grid four-up">{planningModules.map((module) => <article className="module" key={module.title}><Badge tone="green">Employee Planning</Badge><h3>{module.title}</h3><p>{module.detail}</p></article>)}</div></Card>;
}

function HrPortal(props) {
  const { data, activeEmployee, completedTraining, employeeTraining, pendingPto, submitPto, setPtoStatus, submitSupport, resolveSupport, acknowledgeHandbook, completeTraining, addTraining } = props;
  const rooms = ['Profile', 'PTO', 'Handbook', 'HR Support', 'Training'];
  const [activeHrRoom, setActiveHrRoom] = useState('Profile');

  return (
    <>
      <Card><div className="section-heading"><Badge>HR Portal</Badge><h2>Salary employee HR room</h2><p>No time clock. HR owns PTO, handbook, support requests, training, start dates, and anniversaries.</p></div><div className="metrics-grid"><Card><span>Start Date</span><strong>{String(activeEmployee?.startDate).slice(0, 10)}</strong><small>Anniversary: {anniversary(activeEmployee?.startDate)}</small></Card><Card><span>PTO Balance</span><strong>{activeEmployee?.ptoBalance} hrs</strong><small>{pendingPto} pending requests</small></Card><Card><span>Training</span><strong>{completedTraining} / {employeeTraining.length}</strong><small>Completed modules</small></Card><Card><span>Type</span><strong>Salary</strong><small>No punch tracking</small></Card></div></Card>
      <nav className="room-tabs">{rooms.map((room) => <button key={room} className={activeHrRoom === room ? 'active' : ''} onClick={() => setActiveHrRoom(room)}>{room}</button>)}</nav>
      {activeHrRoom === 'Profile' && <EmployeeProfile employee={activeEmployee} />}
      {activeHrRoom === 'PTO' && <PtoRoom data={data} submitPto={submitPto} setPtoStatus={setPtoStatus} />}
      {activeHrRoom === 'Handbook' && <HandbookRoom data={data} employee={activeEmployee} acknowledgeHandbook={acknowledgeHandbook} />}
      {activeHrRoom === 'HR Support' && <SupportRoom data={data} submitSupport={submitSupport} resolveSupport={resolveSupport} />}
      {activeHrRoom === 'Training' && <TrainingRoom data={data} employee={activeEmployee} completeTraining={completeTraining} addTraining={addTraining} />}
    </>
  );
}

function EmployeeProfile({ employee }) {
  if (!employee) return null;
  return <Card><div className="profile-grid"><div><span>Name</span><strong>{employee.name}</strong></div><div><span>Title</span><strong>{employee.title}</strong></div><div><span>Manager</span><strong>{employee.manager}</strong></div><div><span>Status</span><strong>{employee.status}</strong></div></div></Card>;
}

function PtoRoom({ data, submitPto, setPtoStatus }) {
  return (
    <div className="two-column">
      <Card><div className="section-heading"><Badge>PTO Request</Badge><h2>Submit time off</h2></div><form onSubmit={submitPto} className="form-grid"><Field label="Employee"><select name="employeeId">{data.employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></Field><Field label="Type"><select name="type"><option>PTO</option><option>Sick</option><option>Unpaid</option><option>Other</option></select></Field><Field label="Start"><input name="startDate" type="date" required /></Field><Field label="End"><input name="endDate" type="date" required /></Field><Field label="Hours"><input name="hours" type="number" min="1" required /></Field><Field label="Reason"><textarea name="reason" rows="3" required /></Field><button className="primary">Submit request</button></form></Card>
      <Card><div className="section-heading"><Badge>Approval Queue</Badge><h2>PTO tracker</h2></div><div className="stack">{data.ptoRequests.map((request) => <article className="queue-item" key={request.id}><div><strong>{employeeName(data, request.employeeId)}</strong><p>{request.type}: {String(request.startDate).slice(0, 10)} to {String(request.endDate).slice(0, 10)} - {request.hours} hrs</p><Badge>{request.status}</Badge></div><div className="button-row"><button onClick={() => setPtoStatus(request.id, 'Approved')}>Approve</button><button onClick={() => setPtoStatus(request.id, 'Denied')}>Deny</button></div></article>)}</div></Card>
    </div>
  );
}

function HandbookRoom({ data, employee, acknowledgeHandbook }) {
  const signed = data.handbook?.acknowledgedBy?.includes(employee?.id);
  return <Card><div className="section-heading"><Badge>Employee Handbook</Badge><h2>{data.handbook?.title || 'Employee Handbook'}</h2><p>Version {data.handbook?.version} effective {String(data.handbook?.effectiveDate || '').slice(0, 10)}</p></div><div className="document-box"><h3>Handbook acknowledgement</h3><p>Employees can review the current handbook version and acknowledge that they have received and read it.</p><Badge tone={signed ? 'green' : 'amber'}>{signed ? 'Acknowledged' : 'Needs acknowledgement'}</Badge>{!signed && <button className="primary" onClick={acknowledgeHandbook}>Acknowledge handbook</button>}</div></Card>;
}

function SupportRoom({ data, submitSupport, resolveSupport }) {
  return <div className="two-column"><Card><div className="section-heading"><Badge>HR Support</Badge><h2>Submit request</h2></div><form onSubmit={submitSupport} className="form-grid"><Field label="Employee"><select name="employeeId">{data.employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></Field><Field label="Category"><select name="category"><option>Policy Question</option><option>Workplace Support</option><option>Benefits</option><option>Other</option></select></Field><Field label="Summary"><textarea name="summary" rows="5" required /></Field><button className="primary">Submit to HR</button></form></Card><Card><div className="section-heading"><Badge>HR Inbox</Badge><h2>Support queue</h2></div><div className="stack">{data.supportRequests.map((request) => <article className="queue-item" key={request.id}><div><strong>{employeeName(data, request.employeeId)}</strong><p>{request.category}: {request.summary}</p><Badge>{request.status}</Badge></div>{request.status !== 'Resolved' && <button onClick={() => resolveSupport(request.id)}>Resolve</button>}</article>)}</div></Card></div>;
}

function TrainingRoom({ data, employee, completeTraining, addTraining }) {
  return <div className="two-column wide-left"><Card><div className="section-heading"><Badge>Training Module Room</Badge><h2>Assigned training</h2></div><div className="module-grid">{data.training.filter((course) => course.assignedTo?.includes(employee?.id)).map((course) => { const done = course.completedBy?.includes(employee?.id); return <article className="module" key={course.id}><div><Badge>{course.category}</Badge><h3>{course.title}</h3><ul>{course.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul></div><button disabled={done} onClick={() => completeTraining(course.id)}>{done ? 'Completed' : 'Mark complete'}</button></article>; })}</div></Card><Card><div className="section-heading"><Badge>Admin</Badge><h2>Create module</h2></div><form onSubmit={addTraining} className="form-grid"><Field label="Title"><input name="title" required /></Field><Field label="Category"><input name="category" required /></Field><Field label="Lessons"><textarea name="lessons" rows="6" placeholder="One lesson per line" required /></Field><button className="primary">Add module</button></form></Card></div>;
}

function ExternalPortal({ type }) {
  const isVendor = type === 'Vendor';
  return <Card><div className="section-heading"><Badge>{type} Portal</Badge><h2>{type} access stays outside Employee</h2><p>{isVendor ? 'Vendors receive external access only to assigned project packages, PO visibility, due dates, upload slots, and vendor packet status.' : 'Customers receive external access only to approved project status, customer-facing documents, quotes, contracts, change orders, approvals, and uploads.'}</p></div><div className="placeholder-box">Authentication will route {type.toLowerCase()} users directly here, not through the Employee Portal.</div></Card>;
}

export default App;
