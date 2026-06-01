import React, { useEffect, useState } from 'react';
import { apiGet } from './api.js';
import CrmLeadCommandCenter from './CrmLeadCommandCenter.jsx';
import MarketingSeoOptimizer from './MarketingSeoOptimizer.jsx';

const fallback = {
  employees: [{ id: 1, name: 'Avery Taylor', title: 'Project Manager', department: 'Operations', employmentType: 'Salary' }],
  ptoRequests: [],
  supportRequests: [],
  training: [],
};

const topPortals = [
  { id: 'admin', title: 'Admin Portal', audience: 'Owner / system admin', purpose: 'Users, roles, permissions, integrations, setup, audit controls, and global settings.' },
  { id: 'employee', title: 'Employee Portal', audience: 'Internal team', purpose: 'Sales, projects, planning, HR, accounts, CRM, marketing, and field operations.' },
  { id: 'accounting', title: 'Accounting Portal', audience: 'Accounting / finance team', purpose: 'Billing, insurance, POs, AR, AP, SOV, change order billing, and reporting.' },
  { id: 'vendor', title: 'Vendor Portal', audience: 'Outside vendors', purpose: 'Assigned project packages, PO visibility, due dates, uploads, and vendor packet status.' },
  { id: 'customer', title: 'Customer Portal', audience: 'Outside customers', purpose: 'Approved project status, documents, quotes, contracts, change orders, approvals, and uploads.' },
];

const employeeModules = [
  { id: 'crm', title: 'Contacts / CRM', description: 'Lead intake, Twilio calls/texts, tracked email, conversations, AI routing, pipeline, and follow-ups.' },
  { id: 'marketing', title: 'Marketing', description: 'SEO audits, campaign pages, website optimizer, source access gate, and marketing performance.' },
  { id: 'sales', title: 'Sales & Estimating', description: 'Estimate intake, scope builder, cost build, margin review, quote generator, and project checklist.' },
  { id: 'projects', title: 'Project Portal', description: 'Contracted jobs, engineering, material, fabrication, delivery, erection, punch, and closeout.' },
  { id: 'planning', title: 'Planning Portal', description: 'Internal job readiness, planning schedule, handoffs, internal execution, and readiness checks.' },
  { id: 'hr', title: 'HR Portal', description: 'Employee records, PTO, handbook, support, onboarding, and training modules.' },
  { id: 'accounts', title: 'Accounts', description: 'Customer, vendor, contractor, and company account records.' },
  { id: 'erection', title: 'Erection Schedule', description: 'Crew planning, erection dates, field readiness, milestones, and schedule conflicts.' },
];

const accountingModules = ['Billing', 'Insurance', 'Purchase Orders', 'Accounts Receivable', 'Accounts Payable', 'Schedule of Values', 'Change Order Billing', 'Financial Reports'];
const planningModules = ['Job Readiness', 'Internal Schedule', 'Project Handoffs', 'Planning Notes'];

function Badge({ children, tone = 'dark' }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

function App() {
  const [data, setData] = useState(fallback);
  const [status, setStatus] = useState('Connecting to DigitalOcean PostgreSQL...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePortal, setActivePortal] = useState('employee');
  const [activeModule, setActiveModule] = useState('crm');
  const [activeEmployeeId, setActiveEmployeeId] = useState(1);

  useEffect(() => {
    async function refresh() {
      try {
        const next = await apiGet('/api/hr');
        setData(next);
        setStatus(next.employees?.length ? 'Connected to DigitalOcean PostgreSQL' : 'Backend connected. Add employees to begin.');
      } catch (error) {
        setStatus(`Backend not ready: ${error.message}`);
        setData(fallback);
      }
    }
    refresh();
  }, []);

  if (!isAuthenticated) return <AuthLanding onEnter={() => setIsAuthenticated(true)} status={status} />;

  const activeEmployee = data.employees.find((employee) => employee.id === Number(activeEmployeeId)) || data.employees[0];

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <Badge tone="red">Steel Craft Operations Portal</Badge>
          <h1>{activePortal === 'employee' && activeModule === 'crm' ? 'Contacts / CRM' : 'Portal Gateway'}</h1>
          <p>{activePortal === 'employee' && activeModule === 'crm' ? 'Lead intake, calling, texting, tracked email, AI routing, and pipeline visibility.' : 'Authenticated entry into Admin, Employee, Accounting, Vendor, and Customer portals.'}</p>
          <p className="connection-status">{status}</p>
        </div>
        <aside className="hero-panel">
          <span>Current portal</span>
          <strong>{activePortal === 'employee' ? employeeModules.find((module) => module.id === activeModule)?.title : topPortals.find((portal) => portal.id === activePortal)?.title}</strong>
          <small>Customer-facing workflow</small>
        </aside>
      </header>

      <PortalSwitcher activePortal={activePortal} setActivePortal={setActivePortal} />
      {activePortal === 'admin' && <AdminPortal data={data} status={status} />}
      {activePortal === 'employee' && <EmployeePortal data={data} activeEmployee={activeEmployee} activeEmployeeId={activeEmployeeId} setActiveEmployeeId={setActiveEmployeeId} activeModule={activeModule} setActiveModule={setActiveModule} />}
      {activePortal === 'accounting' && <AccountingPortal />}
      {activePortal === 'vendor' && <ExternalPortal type="Vendor" />}
      {activePortal === 'customer' && <ExternalPortal type="Customer" />}
    </main>
  );
}

function AuthLanding({ onEnter, status }) {
  return <main className="auth-shell"><section className="auth-card"><Badge tone="red">Authentication page</Badge><h1>Steel Craft Operations Portal</h1><p>After authentication, users are routed into the correct portal based on role.</p><div className="portal-grid landing-grid">{topPortals.map((portal) => <PortalSummary key={portal.id} portal={portal} />)}</div><p className="connection-status">{status}</p><button className="primary auth-button" onClick={onEnter}>Enter portal preview</button></section></main>;
}

function PortalSwitcher({ activePortal, setActivePortal }) {
  return <nav className="portal-tabs">{topPortals.map((portal) => <button key={portal.id} className={activePortal === portal.id ? 'active' : ''} onClick={() => setActivePortal(portal.id)}>{portal.title}</button>)}</nav>;
}

function PortalSummary({ portal }) {
  return <article className="portal-card"><Badge>{portal.audience}</Badge><h3>{portal.title}</h3><p>{portal.purpose}</p></article>;
}

function AdminPortal({ data, status }) {
  return <Card><div className="section-heading"><Badge>Admin Portal</Badge><h2>System control center</h2><p>Admin owns users, roles, permissions, integrations, setup, and global controls. Customer-facing CRM setup should be placed under CRM Settings, not on the CRM dashboard.</p></div><div className="stats-grid"><div className="stat"><span>Database</span><strong>{status.includes('Connected') ? 'Online' : 'Check'}</strong><small>{status}</small></div><div className="stat"><span>Employees</span><strong>{data.employees.length}</strong><small>User setup source</small></div><div className="stat"><span>CRM setup</span><strong>Settings</strong><small>Schema and merge rules live in settings</small></div><div className="stat"><span>AI</span><strong>Active layer</strong><small>Parsing, scoring, routing, summaries</small></div></div></Card>;
}

function EmployeePortal({ data, activeEmployee, activeEmployeeId, setActiveEmployeeId, activeModule, setActiveModule }) {
  const selectedModule = employeeModules.find((module) => module.id === activeModule);
  return <><Card><div className="section-heading"><Badge>Employee Portal</Badge><h2>Internal operating portal</h2><p>CRM is now a customer-facing lead command center. SEO optimizer belongs under Marketing.</p></div><div className="employee-context"><Field label="Active employee"><select value={activeEmployeeId} onChange={(event) => setActiveEmployeeId(Number(event.target.value))}>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field><div><span>Role</span><strong>{activeEmployee?.title}</strong></div><div><span>Department</span><strong>{activeEmployee?.department}</strong></div><div><span>Module</span><strong>{selectedModule?.title}</strong></div></div></Card><nav className="room-tabs module-tabs">{employeeModules.map((module) => <button key={module.id} className={activeModule === module.id ? 'active' : ''} onClick={() => setActiveModule(module.id)}>{module.title}</button>)}</nav>{activeModule === 'crm' && <CrmLeadCommandCenter />}{activeModule === 'marketing' && <MarketingSeoOptimizer />}{activeModule === 'planning' && <PlanningPortal />}{activeModule !== 'crm' && activeModule !== 'marketing' && activeModule !== 'planning' && <EmployeeModule module={selectedModule} />}</>;
}

function EmployeeModule({ module }) {
  return <Card><div className="section-heading"><Badge>Employee Module</Badge><h2>{module.title}</h2><p>{module.description}</p></div><div className="placeholder-box">This module is ready for its database-backed workflow screens.</div></Card>;
}

function PlanningPortal() {
  return <Card><div className="section-heading"><Badge>Planning Portal</Badge><h2>Internal job planning</h2><p>Planning remains inside Employee. Financial control lives in Accounting.</p></div><div className="module-grid four-up">{planningModules.map((title) => <article className="module" key={title}><Badge tone="green">Planning</Badge><h3>{title}</h3><p>Internal coordination, readiness, handoffs, and blockers.</p></article>)}</div></Card>;
}

function AccountingPortal() {
  return <Card><div className="section-heading"><Badge>Accounting Portal</Badge><h2>Full financial control center</h2><p>Billing, insurance, POs, AR, AP, SOV, change order billing, and financial reporting live here.</p></div><div className="module-grid four-up">{accountingModules.map((title) => <article className="module" key={title}><Badge tone="green">Accounting</Badge><h3>{title}</h3><p>Financial workflow, reporting, and approvals.</p></article>)}</div></Card>;
}

function ExternalPortal({ type }) {
  const isVendor = type === 'Vendor';
  return <Card><div className="section-heading"><Badge>{type} Portal</Badge><h2>{type} access stays outside Employee</h2><p>{isVendor ? 'Vendors receive external access only to assigned project packages, PO visibility, due dates, uploads, and vendor packet status.' : 'Customers receive external access only to approved project status, documents, quotes, contracts, change orders, approvals, and uploads.'}</p></div><div className="placeholder-box">Authentication routes {type.toLowerCase()} users directly here.</div></Card>;
}

export default App;
