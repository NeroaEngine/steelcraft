import React, { useState } from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function LeadGenerationCard({ recordNumber = 'Q-2026-0001' }) {
  const [lead, setLead] = useState({
    source: 'Website / Bid Invitation',
    customer: 'ACME Corp',
    contact: '',
    bidDue: 'Friday',
    status: 'New Lead',
    estimator: 'Seth McBride',
  });

  function update(field, value) {
    setLead((current) => ({ ...current, [field]: value }));
  }

  return (
    <article className="card steelcraft-card lead-generation-card">
      <div className="section-heading">
        <Badge tone="green">Lead Generation</Badge>
        <h2>Lead to Quote Intake</h2>
        <p>Capture the opportunity before it becomes an estimate. No SCB job number is created until award.</p>
      </div>
      <div className="employee-context">
        <Field label="Quote Record"><input value={recordNumber} readOnly /></Field>
        <Field label="Lead Source"><input value={lead.source} onChange={(event) => update('source', event.target.value)} /></Field>
        <Field label="Customer"><input value={lead.customer} onChange={(event) => update('customer', event.target.value)} /></Field>
        <Field label="Contact"><input value={lead.contact} onChange={(event) => update('contact', event.target.value)} /></Field>
        <Field label="Bid Due"><input value={lead.bidDue} onChange={(event) => update('bidDue', event.target.value)} /></Field>
        <Field label="Status"><select value={lead.status} onChange={(event) => update('status', event.target.value)}><option>New Lead</option><option>Qualified</option><option>Estimating</option><option>Proposal Sent</option><option>Follow Up</option></select></Field>
        <Field label="Estimator"><input value={lead.estimator} onChange={(event) => update('estimator', event.target.value)} /></Field>
      </div>
    </article>
  );
}
