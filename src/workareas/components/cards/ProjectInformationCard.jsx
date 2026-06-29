import React, { useState } from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function ProjectInformationCard({ quoteNumber = 'Q-2026-0001' }) {
  const [info, setInfo] = useState({
    estimator: 'Seth McBride',
    projectName: 'Example Metal Building',
    projectAddress: '',
    customerCompany: 'ACME Corp',
    bidToCompany: 'ACME Corp',
    billingAddress: '',
    billingEmail: '',
    paymentApplicationRequired: 'TBD',
  });

  function update(field, value) {
    setInfo((current) => ({ ...current, [field]: value }));
  }

  return (
    <article className="card steelcraft-card project-information-card">
      <div className="section-heading">
        <Badge tone="green">Project Info</Badge>
        <h2>Project Information</h2>
        <p>Customer, billing, estimator, and quote metadata used by estimating, proposal, and award conversion.</p>
      </div>
      <div className="employee-context">
        <Field label="Quote Number"><input value={quoteNumber} readOnly /></Field>
        <Field label="Estimator"><input value={info.estimator} onChange={(event) => update('estimator', event.target.value)} /></Field>
        <Field label="Project Name"><input value={info.projectName} onChange={(event) => update('projectName', event.target.value)} /></Field>
        <Field label="Project Address"><textarea rows="3" value={info.projectAddress} onChange={(event) => update('projectAddress', event.target.value)} /></Field>
        <Field label="Customer Company"><input value={info.customerCompany} onChange={(event) => update('customerCompany', event.target.value)} /></Field>
        <Field label="Bid To Company"><input value={info.bidToCompany} onChange={(event) => update('bidToCompany', event.target.value)} /></Field>
        <Field label="Billing Address"><textarea rows="3" value={info.billingAddress} onChange={(event) => update('billingAddress', event.target.value)} /></Field>
        <Field label="Billing Email"><input value={info.billingEmail} onChange={(event) => update('billingEmail', event.target.value)} /></Field>
        <Field label="Payment Application Required"><select value={info.paymentApplicationRequired} onChange={(event) => update('paymentApplicationRequired', event.target.value)}><option>TBD</option><option>Yes</option><option>No</option></select></Field>
      </div>
    </article>
  );
}
