import React from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function PricingSummaryCard({
  quoteNumber = 'Q-2026-0001',
  subtotal = 0,
  tax = 0,
  markup = 0,
  alternates = 0,
  erection = 0,
  total = 0,
}) {
  return (
    <article className="card steelcraft-card pricing-summary-card">
      <div className="section-heading">
        <Badge tone="green">Pricing Summary</Badge>
        <h2>Quote Financial Summary</h2>
        <p>Generated pricing view for review before proposal output. Values should be projected from the Estimate and Alternates cards.</p>
      </div>
      <div className="module-grid four-up">
        <article className="module"><Badge>Quote</Badge><h3>{quoteNumber}</h3><p>Active quote record.</p></article>
        <article className="module"><Badge>Subtotal</Badge><h3>{money(subtotal)}</h3><p>Base material, freight, engineering, labor, subcontract, and contingency.</p></article>
        <article className="module"><Badge>Tax</Badge><h3>{money(tax)}</h3><p>Generated tax value from approved template logic.</p></article>
        <article className="module"><Badge>Markup</Badge><h3>{money(markup)}</h3><p>Generated markup value.</p></article>
        <article className="module"><Badge>Alternates</Badge><h3>{money(alternates)}</h3><p>Accepted alternates that can roll into contract value.</p></article>
        <article className="module"><Badge>Erection</Badge><h3>{money(erection)}</h3><p>Erection scope pricing.</p></article>
        <article className="module"><Badge tone="green">Proposal Total</Badge><h3>{money(total)}</h3><p>Total value ready for quotation review.</p></article>
        <article className="module"><Badge tone="red">Locked</Badge><h3>Generated</h3><p>This card summarizes values; edits happen in source cards.</p></article>
      </div>
    </article>
  );
}
