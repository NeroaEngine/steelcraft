import React, { useEffect, useState } from 'react';
import { apiGet } from './api.js';
import SteelCraftWorkspace from './workareas/components/SteelCraftWorkspace.jsx';
import SimpleDataImport from './components/SimpleDataImport.jsx';

const topPortals = [
  { id: 'import', title: 'Import Cards', audience: 'Data import', purpose: 'Upload Contacts, Accounts, Project Delivery, and Erection Schedule spreadsheets.' },
  { id: 'admin', title: 'Admin Portal', audience: 'Owner / system admin', purpose: 'Users, roles, permissions, integrations, setup, audit controls, and global settings.' },
  { id: 'employee', title: 'Employee Portal', audience: 'Internal team', purpose: 'Sales, projects, planning, HR, accounts, CRM, marketing, and field operations.' },
  { id: 'accounting', title: 'Accounting Portal', audience: 'Accounting / finance team', purpose: 'Billing, insurance, POs, AR, AP, SOV, change order billing, and reporting.' },
  { id: 'vendor', title: 'Vendor Portal', audience: 'Outside vendors', purpose: 'Assigned project packages, PO visibility, due dates, uploads, and vendor packet status.' },
  { id: 'customer', title: 'Customer Portal', audience: 'Outside customers', purpose: 'Approved project status, documents, quotes, contracts, change orders, approvals, and uploads.' },
];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function App() {
  const [status, setStatus] = useState('Connecting to DigitalOcean PostgreSQL...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState(() => window.location.pathname.includes('/import') ? 'import' : 'workspace');

  useEffect(() => {
    async function refresh() {
      try {
        const next = await apiGet('/api/hr');
        setStatus(next.employees?.length ? 'Connected to DigitalOcean PostgreSQL' : 'Backend connected. Add employees to begin.');
      } catch (error) {
        setStatus(`Backend not ready: ${error.message}`);
      }
    }

    refresh();
  }, []);

  if (activeView === 'import') return <SimpleDataImport />;
  if (!isAuthenticated) return <AuthLanding onEnter={() => setIsAuthenticated(true)} onImport={() => setActiveView('import')} status={status} />;

  return <SteelCraftWorkspace status={status} />;
}

function AuthLanding({ onEnter, onImport, status }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Badge tone="red">Authentication page</Badge>
        <h1>Steel Craft Operations Portal</h1>
        <p>After authentication, users enter the Steel Craft OS workspace built around one Master Project Record.</p>
        <div className="portal-grid landing-grid">
          {topPortals.map((portal) => <PortalSummary key={portal.id} portal={portal} onImport={onImport} />)}
        </div>
        <p className="connection-status">{status}</p>
        <button className="primary auth-button" onClick={onImport}>Open Import Cards</button>
        <button className="auth-button" onClick={onEnter}>Enter Steel Craft OS</button>
      </section>
    </main>
  );
}

function PortalSummary({ portal, onImport }) {
  return (
    <article className="portal-card" onClick={portal.id === 'import' ? onImport : undefined} role={portal.id === 'import' ? 'button' : undefined}>
      <Badge>{portal.audience}</Badge>
      <h3>{portal.title}</h3>
      <p>{portal.purpose}</p>
    </article>
  );
}

export default App;
