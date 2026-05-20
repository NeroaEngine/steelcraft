import React, { useState } from 'react';

const businessDefaults = {
  business_identity_number: 'BIN-STEELCRAFT-001',
  business_address: 'trustnet:business:steelcraft-001',
  business_id: 'steelcraft',
  workspace_id: 'steelcraft-main'
};

const starterRows = [
  ['Atlas Apparel', 'Customer record ready for proof-backed create flow', 'Customer'],
  ['Blank Shirt Supply', 'Vendor record ready for proof-backed create flow', 'Vendor'],
  ['Jamie Contact', 'General contact ready for proof-backed create flow', 'Contact']
];

function ResultCard({ result }) {
  if (!result) return null;
  return <article className="feature panel">
    <p className="eyebrow">TrustNet / Vault result</p>
    <h2>{result.ok ? 'Proof created' : 'Blocked'}</h2>
    {result.ok ? <div className="data-rows">
      <div className="data-row"><div><strong>Receipt</strong><span>{result.receipt_id}</span></div><b>TrustNet</b></div>
      <div className="data-row"><div><strong>Lineage</strong><span>{result.lineage_id}</span></div><b>Vault</b></div>
      <div className="data-row"><div><strong>Event</strong><span>{result.event_id}</span></div><b>{result.record_type}</b></div>
    </div> : <div className="notice">{result.error || result.blocked_reason || 'Contacts / CRM action was blocked by policy.'}</div>}
  </article>;
}

export default function ContactsCrmPortal({ user }) {
  const [form, setForm] = useState({
    record_type: 'contact',
    name: '',
    email: '',
    phone: '',
    notes: '',
    source_refs: 'source:contacts-crm:ui-create-form',
    ...businessDefaults
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [localRows, setLocalRows] = useState([]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const sourceRefs = String(form.source_refs || '').split(',').map((entry) => entry.trim()).filter(Boolean);
      const response = await fetch('/api/contacts-crm/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          actor_id: user?.id || user?.email || 'ui-user',
          actor_type: 'user',
          source_refs: sourceRefs,
          company_name: form.name,
          payload: {
            summary: `${form.record_type} created from Contacts / CRM UI`,
            notes: form.notes || null
          }
        })
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setResult({ ok: false, ...json });
        return;
      }
      setResult(json);
      setLocalRows((rows) => [[json.company?.name || form.name, `${json.receipt_id} / ${json.lineage_id}`, json.record_type], ...rows]);
      setForm((current) => ({ ...current, name: '', email: '', phone: '', notes: '' }));
    } catch (error) {
      setResult({ ok: false, error: error.message || 'Contacts / CRM create failed.' });
    } finally {
      setBusy(false);
    }
  }

  const rows = [...localRows, ...starterRows];

  return <>
    <header className="workspace-header panel">
      <div>
        <p className="eyebrow">Canonical Core / Contacts</p>
        <h1>Contacts / CRM</h1>
        <p>Create contacts, customers, and vendors through the real Contacts / CRM API path. Each successful create emits a Neroa Guard / TrustNet receipt and a linked Neroa Vault lineage record.</p>
      </div>
      <div className="live-badge">TrustNet wired</div>
    </header>

    <div className="workspace-grid">
      <article className="feature panel large">
        <p className="eyebrow">Create with proof</p>
        <h2>New Contacts / CRM record</h2>
        <form className="accounting-live-form" onSubmit={submit}>
          <label>Record type<select value={form.record_type} onChange={(event) => update('record_type', event.target.value)}><option value="contact">Contact</option><option value="customer">Customer</option><option value="vendor">Vendor</option></select></label>
          <label>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Company or contact name" required /></label>
          <label>Email<input value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="name@company.com" /></label>
          <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="Phone" /></label>
          <label>Business identity number<input value={form.business_identity_number} onChange={(event) => update('business_identity_number', event.target.value)} required /></label>
          <label>Business address<input value={form.business_address} onChange={(event) => update('business_address', event.target.value)} required /></label>
          <label>Business ID<input value={form.business_id} onChange={(event) => update('business_id', event.target.value)} /></label>
          <label>Workspace ID<input value={form.workspace_id} onChange={(event) => update('workspace_id', event.target.value)} required /></label>
          <label>Source refs<input value={form.source_refs} onChange={(event) => update('source_refs', event.target.value)} placeholder="source:contacts-crm:ui-create-form" required /></label>
          <label>Notes<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Internal notes" /></label>
          <button className="auth-submit" disabled={busy}>{busy ? 'Creating proof...' : 'Create with TrustNet receipt'}</button>
        </form>
      </article>

      <ResultCard result={result} />

      <article className="feature panel">
        <p className="eyebrow">Recent local creates</p>
        <h2>Proof-backed records</h2>
        <div className="data-rows">{rows.map(([name, detail, type]) => <div className="data-row" key={`${name}-${detail}`}><div><strong>{name}</strong><span>{detail}</span></div><b>{type}</b></div>)}</div>
      </article>

      <article className="feature panel">
        <p className="eyebrow">Fail-closed controls</p>
        <h2>Required before write</h2>
        <div className="data-rows">
          <div className="data-row"><div><strong>Business identity</strong><span>business_identity_number and business_address required</span></div><b>Guard</b></div>
          <div className="data-row"><div><strong>Source refs</strong><span>UI/API create must include source lineage</span></div><b>Vault</b></div>
          <div className="data-row"><div><strong>Receipt + lineage</strong><span>Database write rolls back if proof path blocks</span></div><b>Fail closed</b></div>
        </div>
      </article>
    </div>
  </>;
}
