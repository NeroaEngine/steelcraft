import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './steelcraftAuth.css';

const sessionKey = 'steelcraft_auth_session_v2';

const commandSections = [
  { id: 'crm', label: 'CRM', cards: ['Accounts', 'Contacts', 'Customer History'] },
  { id: 'estimating', label: 'Estimating', cards: ['Working Sheet', 'Estimate', 'Metal Building Generator', 'Dynamic Door', 'F&E Quotation', 'EO Quotation'] },
  { id: 'projects', label: 'Projects', cards: ['Project Information', 'Project Delivery', 'Change Orders', 'Closeout'] },
  { id: 'accounting', label: 'Accounting', cards: ['Invoices', 'Labor SOV', 'Material SOV', 'Project Financials'] },
  { id: 'erection', label: 'Erection', cards: ['Erection Schedule', 'Project Delivery', 'Field Progress'] },
  { id: 'billing', label: 'Billing', cards: ['Invoices', 'Labor SOV', 'Material SOV', 'Billing Package'] },
  { id: 'documents', label: 'Documents', cards: ['COI', 'Quote Docs', 'Change Orders', 'Invoices'] },
  { id: 'profile', label: 'Profile', cards: ['User Profile', 'Company Profile', 'Settings', 'Permissions'] }
];

const kpis = [
  ['Active Projects', '47', '+6 this week'],
  ['Open Quotes', '3,000', '$127,842,000'],
  ['Jobs in Erection', '23', '+3 this week'],
  ['Invoices Due', '28', '$4,523,750'],
  ['Pending COs', '14', '$2,184,300'],
  ['Receipts Today', '156', '+28 today']
];

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(sessionKey)); } catch { return null; }
}

function saveSession(user) {
  sessionStorage.setItem(sessionKey, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(sessionKey);
}

function SteelCraftLogin({ onLogin }) {
  const [email, setEmail] = useState('admin@neroa.io');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Use the Steel Craft preview login to enter Command Center.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Checking login...');

    try {
      const response = await fetch('/api/auth/preview-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'Invalid login.');
      }

      const user = payload.user || {
        email,
        name: (email || 'Steel Craft User').split('@')[0],
        role: 'admin',
        temporaryAuth: true,
        issuedAt: new Date().toISOString()
      };

      saveSession(user);
      history.pushState({}, '', payload.redirectTo || '/command-center');
      onLogin(user);
    } catch (error) {
      setStatus(error.message || 'Login failed.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="sc-auth-page">
      <section className="sc-login-card">
        <img className="sc-login-logo" src="/logo-03.png" alt="Steel Craft Builders" />
        <h1>Steel Craft Login</h1>
        <form onSubmit={submit} className="sc-login-form">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" />
          </label>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
          <p className="sc-login-status">{status}</p>
        </form>
      </section>
    </main>
  );
}

function CommandCenter({ user, onSignOut }) {
  const [active, setActive] = useState('command-center');
  const activeSection = useMemo(() => commandSections.find((section) => section.id === active), [active]);

  return (
    <main className="sc-command-shell">
      <header className="sc-topbar">
        <div className="sc-brand-lockup">
          <img src="/logo-03.png" alt="Steel Craft Builders" />
          <div>
            <strong>Steel Craft OS</strong>
            <span>Forge Runtime</span>
          </div>
        </div>
        <nav>
          <button className={active === 'command-center' ? 'active' : ''} onClick={() => setActive('command-center')}>Command Center</button>
          {commandSections.map((section) => <button key={section.id} className={active === section.id ? 'active' : ''} onClick={() => setActive(section.id)}>{section.label}</button>)}
        </nav>
        <div className="sc-user-pill">
          <span>{user.email}</span>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <section className="sc-command-content">
        <div className="sc-welcome-row">
          <div>
            <p className="sc-eyebrow">Command Center Universe</p>
            <h2>{active === 'command-center' ? 'Welcome to Steel Craft OS' : activeSection?.label}</h2>
            <p>{active === 'command-center' ? 'Post-login command center for CRM, Estimating, Projects, Accounting, Erection, Billing, Documents, and Profile.' : `${activeSection?.label} universe card group loaded through the Steel Craft runtime.`}</p>
          </div>
          <div className="sc-status-card">
            <span>Runtime status</span>
            <strong>Preview Ready</strong>
            <small>Login is now routed through the preview auth endpoint. SQL/OAuth hardening comes next.</small>
          </div>
        </div>

        <div className="sc-kpi-grid">
          {kpis.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
        </div>

        {active === 'command-center' ? <CommandOverview /> : <UniverseSection section={activeSection} />}
      </section>
    </main>
  );
}

function CommandOverview() {
  return (
    <>
      <section className="sc-two-panel">
        <article className="sc-panel">
          <p className="sc-eyebrow">Ask Steel Craft OS</p>
          <h3>Build, open, and route work</h3>
          <div className="sc-prompt-box">How can I help you today?</div>
          <div className="sc-action-row">
            <button>Open a Project</button>
            <button>Create a Quote</button>
            <button>Check Erection Schedule</button>
            <button>Generate Building Model</button>
          </div>
        </article>
        <article className="sc-panel sc-building-panel">
          <p className="sc-eyebrow">System Overview</p>
          <h3>Steel Craft OS unifies operations from lead to closeout.</h3>
          <ul>
            <li>CRM, estimating, and quote management</li>
            <li>Project management and delivery</li>
            <li>Erection and field operations</li>
            <li>Accounting, billing, and documents</li>
          </ul>
        </article>
      </section>
      <UniverseGrid />
    </>
  );
}

function UniverseGrid() {
  return <section className="sc-module-grid">{commandSections.map((section) => <article key={section.id}><span>{section.label}</span><h3>{section.cards[0]}</h3><p>{section.cards.slice(0, 4).join(' · ')}</p><button>Open</button></article>)}</section>;
}

function UniverseSection({ section }) {
  return <section className="sc-module-grid active-universe">{section.cards.map((card) => <article key={card}><span>{section.label}</span><h3>{card}</h3><p>{card} card is registered for the {section.label} universe and ready for SQL hydration.</p><button>Open {card}</button></article>)}</section>;
}

function App() {
  const [user, setUser] = useState(() => readSession());

  function signOut() {
    clearSession();
    history.pushState({}, '', '/');
    setUser(null);
  }

  if (!user) return <SteelCraftLogin onLogin={setUser} />;
  return <CommandCenter user={user} onSignOut={signOut} />;
}

createRoot(document.getElementById('root')).render(<App />);
