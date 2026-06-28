import React, { useState } from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function QuoteCard({ initialQuoteNumber = 'Q-2026-0001' }) {
  const [quote, setQuote] = useState({
    quoteNumber: initialQuoteNumber,
    projectName: 'Example Metal Building Quote',
    customer: 'ACME Corp',
    stage: 'Estimating',
    bidDueDate: 'Friday',
    quoteType: 'Furnish and Erect',
  });

  function update(field, value) {
    setQuote((current) => ({ ...current, [field]: value }));
  }

  return (
    <article className="card steelcraft-card quote-card">
      <div className="section-heading">
        <Badge tone="green">Quote</Badge>
        <h2>Quote Record</h2>
        <p>The quote is the active sales record. It converts to an SCB project only after award or signed contract.</p>
      </div>
      <div className="employee-context">
        <Field label="Quote Number"><input value={quote.quoteNumber} readOnly /></Field>
        <Field label="Project Name"><input value={quote.projectName} onChange={(event) => update('projectName', event.target.value)} /></Field>
        <Field label="Customer"><input value={quote.customer} onChange={(event) => update('customer', event.target.value)} /></Field>
        <Field label="Stage"><select value={quote.stage} onChange={(event) => update('stage', event.target.value)}><option>Lead</option><option>Qualified</option><option>Estimating</option><option>Proposal Sent</option><option>Negotiation</option><option>Awarded</option></select></Field>
        <Field label="Bid Due Date"><input value={quote.bidDueDate} onChange={(event) => update('bidDueDate', event.target.value)} /></Field>
        <Field label="Quote Type"><select value={quote.quoteType} onChange={(event) => update('quoteType', event.target.value)}><option>Furnish and Erect</option><option>Erection Only</option><option>Material Only</option></select></Field>
      </div>
    </article>
  );
}
