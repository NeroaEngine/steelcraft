import React from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export default function MarginAnalysisCard({
  quoteNumber = 'Q-2026-0001',
  contractValue = 0,
  materialCost = 0,
  laborCost = 0,
  freight = 0,
  engineering = 0,
  subcontractCost = 0,
  contingency = 0,
}) {
  const totalCost = Number(materialCost || 0) + Number(laborCost || 0) + Number(freight || 0) + Number(engineering || 0) + Number(subcontractCost || 0) + Number(contingency || 0);
  const grossProfit = Number(contractValue || 0) - totalCost;
  const grossMargin = Number(contractValue || 0) ? (grossProfit / Number(contractValue || 0)) * 100 : 0;
  const costRatio = Number(contractValue || 0) ? (totalCost / Number(contractValue || 0)) * 100 : 0;
  const status = grossMargin >= 18 ? 'Target' : grossMargin > 0 ? 'Review' : 'Incomplete';

  return (
    <article className="card steelcraft-card margin-analysis-card">
      <div className="section-heading">
        <Badge tone={status === 'Target' ? 'green' : 'red'}>Margin Analysis</Badge>
        <h2>Profitability Review</h2>
        <p>Generated margin checkpoint before proposal output. Source values should come from estimate, alternates, and erection pricing.</p>
      </div>
      <div className="module-grid four-up">
        <article className="module"><Badge>Quote</Badge><h3>{quoteNumber}</h3><p>Active estimate record.</p></article>
        <article className="module"><Badge>Contract Value</Badge><h3>{money(contractValue)}</h3><p>Total proposed value.</p></article>
        <article className="module"><Badge>Total Cost</Badge><h3>{money(totalCost)}</h3><p>Material, labor, freight, engineering, subcontract, and contingency.</p></article>
        <article className="module"><Badge tone={status === 'Target' ? 'green' : 'red'}>Gross Profit</Badge><h3>{money(grossProfit)}</h3><p>{percent(grossMargin)} gross margin.</p></article>
        <article className="module"><Badge>Cost Ratio</Badge><h3>{percent(costRatio)}</h3><p>Cost as a percent of contract value.</p></article>
        <article className="module"><Badge>Status</Badge><h3>{status}</h3><p>Margin target uses 18% as the current Steel Craft default.</p></article>
      </div>
    </article>
  );
}
