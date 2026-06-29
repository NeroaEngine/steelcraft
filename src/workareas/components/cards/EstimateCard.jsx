import React, { useMemo, useState } from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function EstimateCard({ quoteNumber = 'Q-2026-0001' }) {
  const [estimate, setEstimate] = useState({
    buildingCost: 0,
    localTaxRate: 7.5,
    markupPercent: 18,
    freight: 0,
    engineering: 0,
    laborCost: 0,
    subcontractCost: 0,
    contingency: 0,
    erectionPrice: 0,
    squareFeet: 0,
  });

  function update(field, value) {
    setEstimate((current) => ({ ...current, [field]: value }));
  }

  const totals = useMemo(() => {
    const subtotal = numberValue(estimate.buildingCost) + numberValue(estimate.freight) + numberValue(estimate.engineering) + numberValue(estimate.laborCost) + numberValue(estimate.subcontractCost) + numberValue(estimate.contingency);
    const tax = numberValue(estimate.buildingCost) * (numberValue(estimate.localTaxRate) / 100);
    const markup = (subtotal + tax) * (numberValue(estimate.markupPercent) / 100);
    const total = subtotal + tax + markup + numberValue(estimate.erectionPrice);
    const costPerSf = numberValue(estimate.squareFeet) ? total / numberValue(estimate.squareFeet) : 0;
    return { subtotal, tax, markup, total, costPerSf };
  }, [estimate]);

  return (
    <article className="card steelcraft-card estimate-card">
      <div className="section-heading">
        <Badge tone="green">Estimate</Badge>
        <h2>Estimate Worksheet</h2>
        <p>Template-backed pricing inputs with generated totals. The UI stays clean while the template remains the source of truth.</p>
      </div>
      <div className="employee-context">
        <Field label="Quote Number"><input value={quoteNumber} readOnly /></Field>
        <Field label="Building Cost"><input type="number" value={estimate.buildingCost} onChange={(event) => update('buildingCost', event.target.value)} /></Field>
        <Field label="Local Tax Rate %"><input type="number" value={estimate.localTaxRate} onChange={(event) => update('localTaxRate', event.target.value)} /></Field>
        <Field label="Markup %"><input type="number" value={estimate.markupPercent} onChange={(event) => update('markupPercent', event.target.value)} /></Field>
        <Field label="Freight"><input type="number" value={estimate.freight} onChange={(event) => update('freight', event.target.value)} /></Field>
        <Field label="Engineering"><input type="number" value={estimate.engineering} onChange={(event) => update('engineering', event.target.value)} /></Field>
        <Field label="Labor Cost"><input type="number" value={estimate.laborCost} onChange={(event) => update('laborCost', event.target.value)} /></Field>
        <Field label="Subcontract Cost"><input type="number" value={estimate.subcontractCost} onChange={(event) => update('subcontractCost', event.target.value)} /></Field>
        <Field label="Contingency"><input type="number" value={estimate.contingency} onChange={(event) => update('contingency', event.target.value)} /></Field>
        <Field label="Erection Price"><input type="number" value={estimate.erectionPrice} onChange={(event) => update('erectionPrice', event.target.value)} /></Field>
        <Field label="Square Feet"><input type="number" value={estimate.squareFeet} onChange={(event) => update('squareFeet', event.target.value)} /></Field>
      </div>
      <div className="module-grid four-up">
        <article className="module"><Badge>Subtotal</Badge><h3>{money(totals.subtotal)}</h3><p>Base estimate costs before tax, markup, and erection.</p></article>
        <article className="module"><Badge>Tax</Badge><h3>{money(totals.tax)}</h3><p>Generated from building cost and tax rate.</p></article>
        <article className="module"><Badge>Markup</Badge><h3>{money(totals.markup)}</h3><p>Generated from editable markup percentage.</p></article>
        <article className="module"><Badge tone="green">Total</Badge><h3>{money(totals.total)}</h3><p>{totals.costPerSf ? `${money(totals.costPerSf)} / SF` : 'Add square footage for cost per SF.'}</p></article>
      </div>
    </article>
  );
}
