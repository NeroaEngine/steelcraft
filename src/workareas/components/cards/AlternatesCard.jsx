import React, { useMemo, useState } from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const defaultAlternates = [
  { id: 'insulation', description: 'Insulation', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0, accepted: false },
  { id: 'ohd', description: 'Overhead Door', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0, accepted: false },
  { id: 'standing-seam', description: 'Standing Seam Roof', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0, accepted: false },
  { id: 'storefront', description: 'Storefront Glass', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0, accepted: false },
  { id: 'windows', description: 'Windows', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0, accepted: false },
  { id: 'roof-curbs', description: 'Roof Curbs / Exhaust Fans', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0, accepted: false },
];

export default function AlternatesCard() {
  const [alternates, setAlternates] = useState(defaultAlternates);

  function updateAlternate(index, field, value) {
    setAlternates((current) => current.map((alternate, alternateIndex) => alternateIndex === index ? { ...alternate, [field]: value } : alternate));
  }

  const pricedAlternates = useMemo(() => alternates.map((alternate) => {
    const cost = numberValue(alternate.cost);
    const fee = cost * (numberValue(alternate.feePercent) / 100);
    const subtotal = cost + fee;
    const tax = subtotal * (numberValue(alternate.taxPercent) / 100);
    const labor = numberValue(alternate.labor);
    return { ...alternate, fee, subtotal, tax, total: subtotal + tax + labor };
  }), [alternates]);

  const acceptedTotal = pricedAlternates.filter((alternate) => alternate.accepted).reduce((sum, alternate) => sum + alternate.total, 0);
  const proposalTotal = pricedAlternates.reduce((sum, alternate) => sum + alternate.total, 0);

  return (
    <article className="card steelcraft-card alternates-card">
      <div className="section-heading">
        <Badge tone="green">Alternates</Badge>
        <h2>Structured Alternate Pricing</h2>
        <p>Alternates stay structured so accepted items can roll into the base contract and Schedule of Values after award.</p>
      </div>
      <div className="module-grid four-up">
        <article className="module"><Badge>Proposal Alternates</Badge><h3>{money(proposalTotal)}</h3><p>Total value across all alternates.</p></article>
        <article className="module"><Badge tone="green">Accepted</Badge><h3>{money(acceptedTotal)}</h3><p>Accepted alternates convert into contract value.</p></article>
      </div>
      <div className="customer-table professional-table" role="table" aria-label="Alternate pricing">
        <div className="customer-table-row customer-table-head" role="row"><span>Description</span><span>Cost</span><span>Fee %</span><span>Tax %</span><span>Labor</span><span>Total</span><span>Accepted</span></div>
        {pricedAlternates.map((alternate, index) => (
          <div className="customer-table-row" role="row" key={alternate.id}>
            <input value={alternate.description} onChange={(event) => updateAlternate(index, 'description', event.target.value)} />
            <input type="number" value={alternate.cost} onChange={(event) => updateAlternate(index, 'cost', event.target.value)} />
            <input type="number" value={alternate.feePercent} onChange={(event) => updateAlternate(index, 'feePercent', event.target.value)} />
            <input type="number" value={alternate.taxPercent} onChange={(event) => updateAlternate(index, 'taxPercent', event.target.value)} />
            <input type="number" value={alternate.labor} onChange={(event) => updateAlternate(index, 'labor', event.target.value)} />
            <strong>{money(alternate.total)}</strong>
            <input type="checkbox" checked={alternate.accepted} onChange={(event) => updateAlternate(index, 'accepted', event.target.checked)} />
          </div>
        ))}
      </div>
    </article>
  );
}
