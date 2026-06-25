import React, { useEffect, useState } from 'react';
import './steelcraftOS.css';

const modules = [
  ['command', 'Command Center'], ['crm', 'CRM & Sales'], ['estimating', 'Estimating'], ['projects', 'Projects'], ['billing', 'Billing'], ['erection', 'Erection'], ['vendors', 'Vendors'], ['accounting', 'Accounting'], ['admin', 'Admin']
];
const stages = ['Lead', 'Qualified', 'Estimating', 'Proposal Sent', 'Follow Up', 'Negotiation', 'Awarded', 'Contract Executed', 'Project Delivery', 'Billing', 'Erection', 'Closeout'];

async function getJson(url) {
  const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `${url} failed`);
  return data;
}
async function postJson(url, body = {}) {
  const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `${url} failed`);
  return data;
}

function LoginScreen({ config, status, vault, error }) {
  return <main className="os-login"><section className="login-card"><div className="logo-lockup"><img src="/brand/scb-logo.png" alt="Steel Craft" /><span>Steel Craft OS</span></div><h1>One job record. One Vault. One operating system.</h1><p>Sign in with Microsoft. This branch uses the isolated <b>steelcraft_os_v1</b> schema and the Steel Craft Vault identity.</p>{error ? <div className="os-alert danger">{error}</div> : null}<a className={`primary-login ${config?.microsoftConfigured ? '' : 'disabled'}`} href="/api/os/auth/microsoft/start">Continue with Microsoft</a>{!config?.microsoftConfigured ? <div className="os-alert">Microsoft OAuth backend is built. Configure MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, and MICROSOFT_REDIRECT_URI to enable sign-in.</div> : null}<div className="login-meta"><span>Schema: {status?.schema || 'steelcraft_os_v1'}</span><span>Vault: {vault?.canonicalVaultId || status?.vaultId || 'vault_steelcraft_001'}</span><span>Policy: {vault?.policyMode || 'fail_closed'}</span></div></section></main>;
}

function Metric({ label, value, note }) { return <div className="os-metric"><strong>{value}</strong><span>{label}</span><small>{note}</small></div>; }

function CommandCenter({ projects, vault, status }) {
  const openProjects = projects.filter((item) => !['closeout', 'closed'].includes(String(item.stage || '').toLowerCase()));
  return <div className="workspace-stack"><section className="hero-panel"><div><p className="eyebrow">Steel Craft OS</p><h1>Project Command Center</h1><p>Every module points back to one master project record: lead, estimate, proposal, contract, delivery, billing, erection, and closeout.</p></div><div className="vault-pill"><b>Vault attached</b><span>{vault?.canonicalVaultId || 'vault_steelcraft_001'}</span></div></section><section className="metric-grid"><Metric value={projects.length} label="Project records" note="steelcraft_os_v1.os_projects" /><Metric value={openProjects.length} label="Active jobs" note="Lead through closeout" /><Metric value={status?.tables?.length || 0} label="OS tables" note={status?.schema || 'steelcraft_os_v1'} /><Metric value={vault?.ok ? 'PASS' : 'PENDING'} label="Vault boundary" note={vault?.policyMode || 'fail_closed'} /></section><section className="os-panel"><div className="panel-head"><div><p className="eyebrow">Lifecycle</p><h2>Master project flow</h2></div><button type="button">New lead</button></div><div className="stage-flow">{stages.map((stage) => <span key={stage}>{stage}</span>)}</div></section><section className="os-panel"><div className="panel-head"><div><p className="eyebrow">Guardrails</p><h2>Production rules</h2></div><b>PolicyBound</b></div><div className="guardrail-grid"><div>No production without signed contract, deposit, and PM.</div><div>No release without signed approval drawings.</div><div>No invoice above approved Schedule of Values.</div><div>Every milestone creates audit log and receipt reference.</div></div></section></div>;
}

function ModuleView({ active }) {
  const title = modules.find(([id]) => id === active)?.[1] || 'Workspace';
  return <div className="workspace-stack"><section className="hero-panel compact"><div><p className="eyebrow">Workspace</p><h1>{title}</h1><p>This is the clean Steel Craft OS lane, not an old portal overlay.</p></div></section><section className="os-panel"><h2>Clean rebuild lane</h2><p>The next commits wire this workspace to steelcraft_os_v1 and the master project record.</p></section></div>;
}

export default function SteelCraftOS() {
  const [session, setSession] = useState(null);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [vault, setVault] = useState(null);
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState('command');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [cfg, sts, vlt, ses] = await Promise.all([getJson('/api/os/auth/config'), getJson('/api/os/status'), getJson('/api/steelcraft/vault/status'), getJson('/api/os/auth/session')]);
      setConfig(cfg); setStatus(sts); setVault(vlt); setSession(ses.user);
      if (ses.user) setProjects((await getJson('/api/os/projects')).projects || []);
    } catch (err) { setError(err.message || String(err)); }
  }
  useEffect(() => { load(); }, []);

  if (!session) return <LoginScreen config={config} status={status} vault={vault} error={error} />;
  const activeTitle = modules.find(([id]) => id === active)?.[1] || 'Command Center';
  return <main className="steelcraft-os"><aside className="os-rail"><div className="os-brand"><img src="/brand/scb-logo.png" alt="Steel Craft" /><b>Steel Craft OS</b></div><nav>{modules.map(([id, title]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>{title}</button>)}</nav></aside><section className="os-main"><header className="os-topbar"><div><span>Workspace</span><strong>{activeTitle}</strong></div><input placeholder="Search job, customer, quote, invoice, RFI..." /><div className="user-chip"><span>{session.full_name || session.email}</span><button onClick={async () => { await postJson('/api/os/auth/logout'); setSession(null); }}>Sign out</button></div></header>{active === 'command' ? <CommandCenter projects={projects} vault={vault} status={status} /> : <ModuleView active={active} />}</section></main>;
}
