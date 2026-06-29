import React, { useState } from 'react';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function WorkingSheetCard() {
  const [sheet, setSheet] = useState({
    buildingCode: 'FBC 23 8th Edition',
    riskCategory: 'II - Normal',
    roofLiveLoad: 'TBD',
    windLoad: 'TBD',
    exposure: 'TBD',
    closureType: 'TBD',
    collateralLoad: 'TBD',
    paymentTerms: 'COD',
    projectNotes: '',
  });

  function update(field, value) {
    setSheet((current) => ({ ...current, [field]: value }));
  }

  return (
    <article className="card steelcraft-card working-sheet-card">
      <div className="section-heading">
        <Badge tone="green">Working Sheet</Badge>
        <h2>Scope & Building Requirements</h2>
        <p>Controlled project scope, building requirements, notes, payment terms, and proposal language inputs.</p>
      </div>
      <div className="employee-context">
        <Field label="Building Code"><input value={sheet.buildingCode} onChange={(event) => update('buildingCode', event.target.value)} /></Field>
        <Field label="Risk Category"><select value={sheet.riskCategory} onChange={(event) => update('riskCategory', event.target.value)}><option>I - Low</option><option>II - Normal</option><option>III - High</option><option>IV - Essential</option></select></Field>
        <Field label="Roof Live Load"><input value={sheet.roofLiveLoad} onChange={(event) => update('roofLiveLoad', event.target.value)} /></Field>
        <Field label="Wind Load"><input value={sheet.windLoad} onChange={(event) => update('windLoad', event.target.value)} /></Field>
        <Field label="Exposure"><select value={sheet.exposure} onChange={(event) => update('exposure', event.target.value)}><option>TBD</option><option>B</option><option>C</option><option>D</option></select></Field>
        <Field label="Closure Type"><select value={sheet.closureType} onChange={(event) => update('closureType', event.target.value)}><option>TBD</option><option>Enclosed</option><option>Open</option><option>Partial</option></select></Field>
        <Field label="Collateral Load"><input value={sheet.collateralLoad} onChange={(event) => update('collateralLoad', event.target.value)} /></Field>
        <Field label="Payment Terms"><input value={sheet.paymentTerms} onChange={(event) => update('paymentTerms', event.target.value)} /></Field>
        <Field label="Project Notes"><textarea rows="4" value={sheet.projectNotes} onChange={(event) => update('projectNotes', event.target.value)} /></Field>
      </div>
    </article>
  );
}
