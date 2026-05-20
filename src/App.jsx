import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AccountingPortal from './AccountingPortal.jsx';
import ContactsCrmPortal from './ContactsCrmPortal.jsx';
import { canonicalPortals, defaultTenantModuleMap, getTenantPortals, industryPacks } from './portalRegistry.js';
import './styles.css';
import './brandGeometry.js';
import './brandThemePacks.js';
import './accountingLayout.css';
import './accountingHardLock.css';

const brandKey = 'steelcraft_brand_controls_v1';
const enabledKey = 'steelcraft_enabled_portals_v1';
const sessionKey = 'steelcraft_auth_session_v1';
const developerLockedKey = 'steelcraft_developer_room_locked';

const languages = [
  ['en', 'English'],
  ['es', 'Spanish / Espanol'],
  ['ht', 'Haitian Creole'],
  ['pt', 'Portuguese'],
  ['fr', 'French'],
  ['de', 'German']
];

function portalTuple(portal) {
  return [portal.id, portal.title, portal.kind, portal.description, portal];
}

const tenantModuleMap = defaultTenantModuleMap;
const portalRecords = getTenantPortals(tenantModuleMap);
const portals = portalRecords.map(portalTuple);
const developerMeta = ['developer', 'Developer Room', 'System builder controls', 'Brand Room, portal controls, tenant setup, integrations, infrastructure, and module enablement.'];
const customerPortalIds = portalRecords.map((portal) => portal.id);
const canonicalPortalIds = canonicalPortals.map((portal) => portal.id);
const industryPortalIds = industryPacks[tenantModuleMap.industryPack].portals.map((portal) => portal.id);
const defaultEnabledPortals = customerPortalIds;

const rolePortals = {
  developer: ['developer', ...customerPortalIds],
  admin: customerPortalIds,
  accounting: ['accounting', 'contacts', 'employee'],
  employee: ['employee'],
  vendor: ['vendor'],
  customer: ['customer']
};

const brandDefaults = {
  tenantName: 'Steel Craft',
  logoText: 'Steel Craft',
  logoSubtext: 'Operations Portal',
  logoUrl: '',
  logoMode: 'initials',
  logoShape: 'square',
  navLayout: 'dock-left',
  uiTheme: 'steelcraft-dark',
  primaryColor: '#0f1014',
  accentColor: '#9f3d42',
  pageBgColor: '#030303',
  surfaceColor: '#141418',
  surfaceAltColor: '#1e1e24',
  textColor: '#f6f0ea',
  mutedTextColor: '#b7aaa3',
  borderColor: '#343036',
  buttonColor: '#9f3d42',
  buttonTextColor: '#ffffff',
  successColor: '#3fb56f',
  warningColor: '#d99b34',
  dangerColor: '#d34b4b',
  infoColor: '#4c9bd9',
  sidebarColor: '#111116',
  topbarColor: '#111116',
  cardColor: '#151519',
  inputColor: '#202026',
  shadowColor: '#000000',
  radius: 22,
  buttonRadius: 999,
  cardPadding: 24,
  density: 14,
  borderWidth: 1,
  shadowStrength: 58,
  fontScale: 100,
  logoSize: 44
};

function loadBrand() { try { return { ...brandDefaults, ...(JSON.parse(localStorage.getItem(brandKey)) || {}) }; } catch { return brandDefaults; } }
function saveBrand(next) { localStorage.setItem(brandKey, JSON.stringify(next)); }
function resetSteelCraftBrand() { localStorage.setItem(brandKey, JSON.stringify(brandDefaults)); localStorage.setItem(enabledKey, JSON.stringify(defaultEnabledPortals)); }
function loadEnabledPortals() { try { const saved = JSON.parse(localStorage.getItem(enabledKey)); return Array.isArray(saved) && saved.length ? saved.filter((id) => customerPortalIds.includes(id)) : defaultEnabledPortals; } catch { return defaultEnabledPortals; } }
function saveEnabledPortals(next) { localStorage.setItem(enabledKey, JSON.stringify(next)); }
function lockDeveloperRoom() { localStorage.setItem(developerLockedKey, 'true'); }
function unlockDeveloperRoom() { localStorage.removeItem(developerLockedKey); }
function isDeveloperLocked() { return localStorage.getItem(developerLockedKey) === 'true'; }
function routePath() { return location.pathname.replace(/\/$/, '') || '/'; }
function portalUrl(id) { return `/portal/${id}`; }
function pathPortalId() { const match = routePath().match(/^\/portal\/([^/]+)/); return match ? match[1] : null; }
function goTo(path) { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }
function meta(id) { return id === 'developer' ? developerMeta : (portals.find(([pid]) => pid === id) || portals[0]); }
function portalRecord(id) { return meta(id)?.[4] || null; }
function enabledPortalMeta(enabledPortals) { return portals.filter(([id]) => enabledPortals.includes(id)); }
function portalPackageLabel(id) { const record = portalRecord(id); return record?.scope === 'industry' ? 'Metal Buildings' : 'Canonical Core'; }
function initials(text) { return (text || 'Brand').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase(); }
function languageName(code) { return languages.find(([id]) => id === code)?.[1] || code || 'English'; }
function styleVars(b) { return { '--brand-accent': b.accentColor, '--page-bg': b.pageBgColor, '--surface': b.surfaceColor, '--surface-alt': b.surfaceAltColor, '--text': b.textColor, '--muted': b.mutedTextColor, '--line': b.borderColor, '--button': b.buttonColor, '--button-text': b.buttonTextColor, '--sidebar': b.sidebarColor, '--topbar': b.topbarColor, '--card': b.cardColor, '--input': b.inputColor, '--shadow': b.shadowColor, '--radius': `${b.radius}px`, '--button-radius': `${b.buttonRadius}px`, '--card-padding': `${b.cardPadding}px`, '--gap': `${b.density}px`, '--border-width': `${b.borderWidth}px`, '--shadow-strength': `${b.shadowStrength}%`, '--font-scale': `${b.fontScale}%`, '--logo-size': `${b.logoSize}px` }; }

function toAppUser(dbUser) {
  const role = dbUser?.role || 'admin';
  return {
    id: String(dbUser?.id || role),
    dbId: dbUser?.id,
    role,
    name: dbUser?.name || dbUser?.full_name || 'User',
    email: dbUser?.email || '',
    language: dbUser?.language || 'en',
    portals: rolePortals[role] || rolePortals.employee
  };
}
function loadSession() { try { const saved = JSON.parse(sessionStorage.getItem(sessionKey)); return saved ? toAppUser(saved) : null; } catch { return null; } }
function saveSession(user) { sessionStorage.setItem(sessionKey, JSON.stringify(user)); }
function clearSession() { sessionStorage.removeItem(sessionKey); }

function LogoGlyph({ brand }) {
  if (brand.logoMode === 'none') return null;
  if (brand.logoMode === 'image' && brand.logoUrl) return <img className={`brand-logo-img logo-${brand.logoShape}`} src={brand.logoUrl} alt={`${brand.logoText} logo`} />;
  if (brand.logoMode === 'text') return null;
  return <div className={`brand-initials logo-${brand.logoShape}`}>{initials(brand.logoText)}</div>;
}
function BrandMark({ brand }) { return <div className={`brand logo-mode-${brand.logoMode}`}><LogoGlyph brand={brand} /><div><strong>{brand.logoText}</strong><small>{brand.logoSubtext}</small></div></div>; }
function DockButton({ onClick }) { return <button className="dock-trigger" onClick={onClick} aria-label="Open portal dock"><span></span><span></span><span></span></button>; }
function PortalList({ items, active, open }) { return <div className="nav-list">{items.map(([id, title, kind, desc]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => open(id)}><strong>{title}</strong><span>{kind}</span><small>{desc}</small></button>)}</div>; }

function Shell({ brand, user, active, signOut, children, enabledPortals }) {
  const [open, setOpen] = useState(false);
  const allowed = portals.filter(([id]) => user.portals.includes(id) && enabledPortals.includes(id));
  const current = meta(active);
  const permanent = ['top-rail', 'bottom-dock', 'left-sidebar', 'right-sidebar'].includes(brand.navLayout);
  const choose = (id) => { goTo(portalUrl(id)); setOpen(false); };
  return <main className={`dashboard layout-${brand.navLayout} theme-${brand.uiTheme}`} style={styleVars(brand)}><header className="erp-topbar panel"><BrandMark brand={brand} /><div className="topbar-meta"><span>Signed in as</span><strong>{user.name}</strong><small>{languageName(user.language)} · {allowed.length} portals</small></div>{brand.navLayout === 'top-rail' && <PortalList items={allowed} active={active} open={choose} />}<div className="current-portal"><span>Current portal</span><strong>{current[1]}</strong></div><button className="sign-out" onClick={signOut}>Sign out</button></header>{brand.navLayout !== 'top-rail' && <DockButton onClick={() => setOpen(true)} />}{(brand.navLayout === 'left-sidebar' || brand.navLayout === 'right-sidebar') && <aside className="persistent-sidebar panel"><p className="eyebrow">Portal navigation</p><PortalList items={allowed} active={active} open={choose} /></aside>}{brand.navLayout === 'bottom-dock' && <nav className="bottom-nav panel"><PortalList items={allowed} active={active} open={choose} /></nav>}<div className={`dock-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />{!permanent && <aside className={`portal-dock panel ${open ? 'open' : ''}`}><div className="dock-head"><div><p className="eyebrow">Portal dock</p><h2>Available workspaces</h2></div><button onClick={() => setOpen(false)}>×</button></div><PortalList items={allowed} active={active} open={choose} /></aside>}<section className="workspace">{children}</section></main>;
}

function DeveloperShell({ brand, user, signOut, children }) {
  return <main className="dashboard layout-dock-left theme-steelcraft-dark developer-route" style={styleVars(brand)}><header className="erp-topbar panel"><BrandMark brand={brand} /><div className="topbar-meta"><span>Signed in as</span><strong>{user.name}</strong><small>developer-only system area</small></div><div className="current-portal"><span>Current room</span><strong>Developer</strong></div><button className="sign-out" onClick={signOut}>Sign out</button></header><section className="workspace">{children}</section></main>;
}
function Header({ id }) { const [, title, kind, desc] = meta(id); return <header className="workspace-header panel"><div><p className="eyebrow">{kind}</p><h1>{title}</h1><p>{desc}</p></div><div className="live-badge">{portalPackageLabel(id)}</div></header>; }
function RecordList({ title, rows }) { return <article className="feature panel"><h2>{title}</h2><div className="data-rows">{rows.map(([a, b, c]) => <div className="data-row" key={a}><div><strong>{a}</strong><span>{b}</span></div><b>{c}</b></div>)}</div></article>; }
function Portal({ id }) { const record = portalRecord(id); const rows = record?.scope === 'industry' ? [[record.title, `${record.canonicalKey} lives in the ${industryPacks[tenantModuleMap.industryPack].title} industry pack.`, record.package], ['Data boundary', id === 'projects' ? 'Steel Craft project data should map into metal_building_projects over the canonical project record.' : 'Industry-specific tables should extend the canonical record when needed.', 'Industry']] : [[record?.title || 'Workspace', `${record?.canonicalKey || id} is part of the reusable core package.`, 'Core'], ['Data boundary', 'Reusable across tenants and industry packs.', 'Canonical']]; return <><Header id={id} /><div className="workspace-grid"><article className="feature panel large"><p className="eyebrow">{record?.scope === 'industry' ? 'Industry portal' : 'Canonical portal'}</p><h2>{meta(id)[1]}</h2><p>{meta(id)[3]}</p>{id === 'projects' && <div className="notice">Metal Buildings Projects should hold Steel Craft-specific project fields while linking back to the canonical project record.</div>}</article><RecordList title="Portal registry" rows={rows} /></div></>; }

function DeveloperRoom({ enabledPortals, setEnabledPortals }) {
  const [locked, setLocked] = useState(isDeveloperLocked());
  const togglePortal = (portalId) => setEnabledPortals((current) => { const next = current.includes(portalId) ? current.filter((id) => id !== portalId) : [...current, portalId]; saveEnabledPortals(next); return next; });
  const resetTenant = () => { resetSteelCraftBrand(); setEnabledPortals(defaultEnabledPortals); window.location.reload(); };
  const setLock = () => { lockDeveloperRoom(); setLocked(true); };
  const setUnlock = () => { unlockDeveloperRoom(); setLocked(false); };
  const rows = [['Core Package', 'Admin, Accounting, Contacts, HR, Vendor, Customer, Employee.', 'Canonical'], ['Industry Pack', 'Sales, Estimating, Projects, Planning, Purchasing.', 'Metal Buildings'], ['Portal URLs', 'Each portal has its own route under /portal/{portal-id}.', 'Live'], ['Tenant Module Map', `${tenantModuleMap.tenantName} uses ${tenantModuleMap.industryPack}.`, 'Live'], ['Developer Lock', locked ? 'Developer room is marked locked for handoff.' : 'Developer room is editable during prototype.', 'Local']];
  const canonicalRows = portals.filter(([id]) => canonicalPortalIds.includes(id));
  const industryRows = portals.filter(([id]) => industryPortalIds.includes(id));
  return <><Header id="developer" /><div className="workspace-grid"><article className="feature panel large"><p className="eyebrow">Max developer controls</p><h2>System builder room</h2><p>This room is authenticated now. Use admin@neroa.io for developer access, and lock this area once Steel Craft is ready for handoff.</p><div className="quote-actions"><button type="button" onClick={() => goTo('/brand')}>Open Brand Room</button><button type="button" onClick={resetTenant}>Reset to Steel Craft</button><button type="button" onClick={locked ? setUnlock : setLock}>{locked ? 'Unlock Developer' : 'Lock Developer'}</button><button type="button" onClick={() => goTo('/portal/admin')}>Preview Admin Portal</button></div></article><RecordList title="Module map" rows={rows} /></div><article className="feature panel access-manager"><p className="eyebrow">Canonical Core</p><h2>Reusable portals every tenant can share</h2><div className="portal-permission-grid">{canonicalRows.map(([id, title, kind]) => <label className="permission-toggle" key={id}><input type="checkbox" disabled={locked} checked={enabledPortals.includes(id)} onChange={() => togglePortal(id)} /><span><strong>{title}</strong><small>{kind} · core · {portalUrl(id)}</small></span></label>)}</div></article><article className="feature panel access-manager"><p className="eyebrow">Industry Pack / Metal Buildings</p><h2>Steel Craft-specific workflow portals</h2><div className="portal-permission-grid">{industryRows.map(([id, title, kind]) => <label className="permission-toggle" key={id}><input type="checkbox" disabled={locked} checked={enabledPortals.includes(id)} onChange={() => togglePortal(id)} /><span><strong>{title}</strong><small>{kind} · metal_buildings · {portalUrl(id)}</small></span></label>)}</div></article></>;
}

function Admin({ profiles, setProfiles, enabledPortals }) {
  const [authUsers, setAuthUsers] = useState([]);
  const [authMessage, setAuthMessage] = useState('');
  const customerProfiles = profiles.filter((profile) => profile.id !== 'developer');
  const [selected, setSelected] = useState(customerProfiles[0]?.id || 'admin');
  const profile = profiles.find((p) => p.id === selected) || customerProfiles[0];
  const availablePortals = enabledPortalMeta(enabledPortals);
  useEffect(() => { fetch('/api/auth/users').then((res) => res.json()).then((json) => setAuthUsers(json.users || [])).catch(() => setAuthMessage('User language list could not be loaded.')); }, []);
  const toggle = (pid) => setProfiles((all) => all.map((p) => p.id !== profile.id ? p : { ...p, portals: p.portals.includes(pid) ? p.portals.filter((x) => x !== pid) : [...p.portals, pid] }));
  async function updateLanguage(userId, language) {
    setAuthMessage('Saving language...');
    const res = await fetch(`/api/auth/users/${userId}/language`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language }) });
    const json = await res.json();
    if (!res.ok || !json.ok) { setAuthMessage(json.error || 'Language update failed.'); return; }
    setAuthUsers((users) => users.map((user) => user.id === json.user.id ? { ...user, language: json.user.language } : user));
    setAuthMessage('Language saved.');
  }
  return <><Header id="admin" /><div className="workspace-grid"><article className="feature panel access-manager"><p className="eyebrow">Admin permissions</p><h2>Assign available portals</h2><p>Admin can assign or restrict user access only within the portals that Max Developer enabled for this tenant.</p><label>Role / user<select value={selected} onChange={(e) => setSelected(e.target.value)}>{customerProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="portal-permission-grid">{availablePortals.map(([id, title, kind]) => <label className="permission-toggle" key={id}><input type="checkbox" checked={profile?.portals.includes(id)} onChange={() => toggle(id)} /><span><strong>{title}</strong><small>{kind} · {portalPackageLabel(id)}</small></span></label>)}</div></article><article className="feature panel access-manager"><p className="eyebrow">Authentication users</p><h2>Login language</h2><p>Pick the language each authenticated user sees after login. This is stored in the DigitalOcean database.</p>{authMessage && <div className="notice">{authMessage}</div>}<div className="data-rows">{authUsers.map((user) => <div className="data-row" key={user.id}><div><strong>{user.full_name}</strong><span>{user.email} · {user.role}</span></div><select value={user.language || 'en'} onChange={(e) => updateLanguage(user.id, e.target.value)}>{languages.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></div>)}</div></article><RecordList title="Current enabled access" rows={customerProfiles.map((p) => [p.name, p.email, p.portals.filter((id) => enabledPortals.includes(id)).map((id) => meta(id)[1]).join(', ') || 'No enabled portals'])} /></div></>;
}

function Auth({ brand, onSignIn, requestedPath }) {
  const isDeveloperPath = requestedPath === '/developer';
  const [email, setEmail] = useState(isDeveloperPath ? 'admin@neroa.io' : 'seth@steelcraftbuilders.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Login failed.');
      onSignIn(toAppUser(json.user));
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }
  return <main className={`landing-dark auth-page theme-${brand.uiTheme}`} style={styleVars(brand)}><section className="landing-card panel auth-only"><BrandMark brand={brand} /><p className="eyebrow">Database authentication</p><h1>{brand.logoText} ERP Login</h1><p>{isDeveloperPath ? 'Developer URL detected. Use admin@neroa.io to open Developer Room.' : 'Customer/admin login opens the Admin portal first. Language is controlled by Admin.'}</p>{error && <div className="notice">{error}</div>}<form className="accounting-live-form" onSubmit={submit}><label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /></label><button className="auth-submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button></form></section></main>;
}

function BrandControls({ brand, user }) {
  const [localBrand, setLocalBrand] = useState(loadBrand);
  if (!user || user.role !== 'developer') return <Auth brand={brand} requestedPath="/developer" onSignIn={() => goTo('/developer')} />;
  const update = (k, v) => { const next = { ...localBrand, [k]: v }; setLocalBrand(next); saveBrand(next); };
  const upload = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => update('logoUrl', reader.result); reader.readAsDataURL(file); };
  const reset = () => { resetSteelCraftBrand(); window.location.reload(); };
  return <main className={`dashboard brand-controls layout-${localBrand.navLayout} theme-${localBrand.uiTheme}`} style={styleVars(localBrand)}><section className="workspace solo"><header className="workspace-header panel brand-studio-header"><div><p className="eyebrow">Max Developer / Brand Room</p><h1>White-label Design Studio</h1><p>This room belongs under Developer Room. It stays stable while choosing tenant UI/UX, logo, and colors.</p></div><div className="quote-actions"><button onClick={reset}>Reset to Steel Craft</button><button onClick={() => goTo('/developer')}>Back to Developer</button></div></header><div className="brand-studio-grid"><article className="feature panel"><h2>Logo controls</h2><BrandMark brand={localBrand} /><label>Upload logo<input type="file" accept="image/*" onChange={upload} /></label><label>Logo URL<input value={localBrand.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://..." /></label><label>Logo text<input value={localBrand.logoText} onChange={(e) => update('logoText', e.target.value)} /></label><label>Logo subtext<input value={localBrand.logoSubtext} onChange={(e) => update('logoSubtext', e.target.value)} /></label><label>Logo shape<select value={localBrand.logoShape} onChange={(e) => update('logoShape', e.target.value)}><option value="square">Square</option><option value="rounded">Rounded</option><option value="circle">Circle</option><option value="wide">Wide</option></select></label><label className="range-control"><span>Logo size <b>{localBrand.logoSize}</b></span><input type="range" min="28" max="160" value={localBrand.logoSize} onChange={(e) => update('logoSize', Number(e.target.value))} /></label></article></div></section></main>;
}

function App() {
  const [profiles, setProfiles] = useState([{ id: 'admin', name: 'Admin / Owner', email: 'seth@steelcraftbuilders.com', portals: customerPortalIds }, { id: 'accounting', name: 'Accounting', email: 'accounting@steelcraft.local', portals: ['accounting', 'contacts', 'employee'] }, { id: 'employee', name: 'Employee', email: 'employee@steelcraft.local', portals: ['employee'] }, { id: 'vendor', name: 'Vendor User', email: 'vendor@steelcraft.local', portals: ['vendor'] }, { id: 'customer', name: 'Customer User', email: 'customer@steelcraft.local', portals: ['customer'] }]);
  const [enabledPortals, setEnabledPortals] = useState(loadEnabledPortals);
  const [user, setUser] = useState(loadSession);
  const [path, setPath] = useState(routePath());
  const brand = useMemo(loadBrand, []);
  useEffect(() => { const onPop = () => setPath(routePath()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);

  const signIn = (nextUser) => {
    saveSession(nextUser);
    setUser(nextUser);
    if (nextUser.role === 'developer' && path === '/developer') return;
    if (nextUser.role === 'developer' && path === '/brand') return;
    if (nextUser.portals.includes('admin')) goTo('/portal/admin'); else goTo(portalUrl(nextUser.portals[0] || 'employee'));
  };
  const signOut = () => { clearSession(); setUser(null); goTo('/'); };

  if (path === '/brand') return <BrandControls brand={brand} user={user} />;

  const requestedPortal = pathPortalId();
  const isDeveloperPath = path === '/developer';

  if (!user) return <Auth brand={brand} requestedPath={path} onSignIn={signIn} />;

  if (isDeveloperPath) {
    if (user.role !== 'developer') { goTo('/portal/admin'); return null; }
    if (isDeveloperLocked()) { /* locked means settings are read-only, not hidden from developer */ }
    return <DeveloperShell brand={brand} user={user} signOut={signOut}><DeveloperRoom enabledPortals={enabledPortals} setEnabledPortals={setEnabledPortals} /></DeveloperShell>;
  }

  const active = requestedPortal && user.portals.includes(requestedPortal) && enabledPortals.includes(requestedPortal) ? requestedPortal : (user.portals.find((id) => enabledPortals.includes(id)) || 'admin');
  if (!requestedPortal) goTo(portalUrl(active));

  return <Shell brand={brand} user={user} active={active} signOut={signOut} enabledPortals={enabledPortals}>{active === 'admin' ? <Admin profiles={profiles} setProfiles={setProfiles} enabledPortals={enabledPortals} /> : active === 'accounting' ? <AccountingPortal /> : active === 'contacts' ? <ContactsCrmPortal user={user} /> : <Portal id={active} />}</Shell>;
}

createRoot(document.getElementById('root')).render(<App />);