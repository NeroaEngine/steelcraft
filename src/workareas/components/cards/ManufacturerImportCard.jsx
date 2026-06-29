import React, { useState } from 'react';

const manufacturers = ['Whirlwind', 'Nucor', 'Chief', 'Metallic', 'MBS', 'Other'];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function ManufacturerImportCard({ quoteNumber = 'Q-2026-0001' }) {
  const [importState, setImportState] = useState({
    manufacturer: 'Whirlwind',
    fileName: '',
    reviewStatus: 'Waiting for upload',
    width: '',
    length: '',
    eaveHeight: '',
    roofPitch: '',
    windLoad: '',
    roofLiveLoad: '',
    exposure: '',
    collateralLoad: '',
    manufacturerCost: '',
  });

  function update(field, value) {
    setImportState((current) => ({ ...current, [field]: value }));
  }

  function markReviewed() {
    setImportState((current) => ({ ...current, reviewStatus: 'Reviewed and ready for estimate' }));
  }

  return (
    <article className="card steelcraft-card manufacturer-import-card">
      <div className="section-heading">
        <Badge tone="green">Manufacturer Import</Badge>
        <h2>Quote PDF Import</h2>
        <p>Manufacturer quote data maps into approved estimating fields and requires human review before it feeds the proposal.</p>
      </div>
      <div className="employee-context">
        <Field label="Quote Number"><input value={quoteNumber} readOnly /></Field>
        <Field label="Manufacturer"><select value={importState.manufacturer} onChange={(event) => update('manufacturer', event.target.value)}>{manufacturers.map((manufacturer) => <option key={manufacturer}>{manufacturer}</option>)}</select></Field>
        <Field label="File Name"><input value={importState.fileName} onChange={(event) => update('fileName', event.target.value)} placeholder="Uploaded PDF or export file" /></Field>
        <Field label="Review Status"><input value={importState.reviewStatus} readOnly /></Field>
        <Field label="Width"><input value={importState.width} onChange={(event) => update('width', event.target.value)} /></Field>
        <Field label="Length"><input value={importState.length} onChange={(event) => update('length', event.target.value)} /></Field>
        <Field label="Eave Height"><input value={importState.eaveHeight} onChange={(event) => update('eaveHeight', event.target.value)} /></Field>
        <Field label="Roof Pitch"><input value={importState.roofPitch} onChange={(event) => update('roofPitch', event.target.value)} /></Field>
        <Field label="Wind Load"><input value={importState.windLoad} onChange={(event) => update('windLoad', event.target.value)} /></Field>
        <Field label="Roof Live Load"><input value={importState.roofLiveLoad} onChange={(event) => update('roofLiveLoad', event.target.value)} /></Field>
        <Field label="Exposure"><input value={importState.exposure} onChange={(event) => update('exposure', event.target.value)} /></Field>
        <Field label="Collateral Load"><input value={importState.collateralLoad} onChange={(event) => update('collateralLoad', event.target.value)} /></Field>
        <Field label="Manufacturer Cost"><input type="number" value={importState.manufacturerCost} onChange={(event) => update('manufacturerCost', event.target.value)} /></Field>
      </div>
      <button className="primary auth-button" type="button" onClick={markReviewed}>Mark Import Reviewed</button>
    </article>
  );
}
