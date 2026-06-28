import React, { useMemo, useState } from 'react';
import { getModelRenderableComponents } from '../registry/steelcraft-component-library.ts';

const initialBuilding = {
  width: 100,
  length: 200,
  eaveHeight: 18,
  roofPitch: '1:12',
  baySpacing: 25,
  roofColor: 'Galvalume',
  wallColor: 'Polar White',
  trimColor: 'Charcoal Gray',
};

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function ModelDesignerWorkArea({ runtime }) {
  const components = getModelRenderableComponents();
  const [building, setBuilding] = useState(initialBuilding);
  const [selectedComponentIds, setSelectedComponentIds] = useState(['frames', 'roof-panels', 'wall-panels', 'roll-up-door', 'walk-door']);

  const selectedComponents = useMemo(() => components.filter((component) => selectedComponentIds.includes(component.id)), [components, selectedComponentIds]);

  function updateBuilding(field, value) {
    setBuilding((current) => ({ ...current, [field]: value }));
  }

  function toggleComponent(componentId) {
    setSelectedComponentIds((current) => current.includes(componentId) ? current.filter((id) => id !== componentId) : [...current, componentId]);
  }

  const recordNumber = runtime?.project?.projectNumber || runtime?.project?.quoteNumber || 'Q-2026-0001';

  return (
    <section className="card model-designer-workarea">
      <div className="section-heading">
        <Badge tone="green">Model Designer</Badge>
        <h2>Plan Upload to Metal Building Model</h2>
        <p>Upload plans, review model assumptions, select Steel Craft components, and send the takeoff into estimating and MBS.</p>
      </div>

      <div className="module-grid four-up">
        <article className="module"><Badge>Quote</Badge><h3>{recordNumber}</h3><p>The model stays on the quote until award creates the SCB project record.</p></article>
        <article className="module"><Badge>Plan Upload</Badge><h3>Ready</h3><p>Plan set upload and model review attach here.</p></article>
        <article className="module"><Badge>Components</Badge><h3>{selectedComponents.length}</h3><p>Selected components feed the takeoff and estimate.</p></article>
        <article className="module"><Badge>MBS</Badge><h3>Connector Shell</h3><p>Dimensions, loads, accessories, and catalog selections export to MBS.</p></article>
      </div>

      <div className="card">
        <div className="section-heading"><Badge>Building Model Inputs</Badge><h2>Manual Model Controls</h2><p>These controls let us demo the building model while plan and MBS automation are being connected.</p></div>
        <div className="employee-context">
          <Field label="Width"><input type="number" value={building.width} onChange={(event) => updateBuilding('width', event.target.value)} /></Field>
          <Field label="Length"><input type="number" value={building.length} onChange={(event) => updateBuilding('length', event.target.value)} /></Field>
          <Field label="Eave Height"><input type="number" value={building.eaveHeight} onChange={(event) => updateBuilding('eaveHeight', event.target.value)} /></Field>
          <Field label="Roof Pitch"><input value={building.roofPitch} onChange={(event) => updateBuilding('roofPitch', event.target.value)} /></Field>
          <Field label="Bay Spacing"><input type="number" value={building.baySpacing} onChange={(event) => updateBuilding('baySpacing', event.target.value)} /></Field>
          <Field label="Roof Color"><input value={building.roofColor} onChange={(event) => updateBuilding('roofColor', event.target.value)} /></Field>
          <Field label="Wall Color"><input value={building.wallColor} onChange={(event) => updateBuilding('wallColor', event.target.value)} /></Field>
          <Field label="Trim Color"><input value={building.trimColor} onChange={(event) => updateBuilding('trimColor', event.target.value)} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-heading"><Badge>Viewer</Badge><h2>Model Viewer Placeholder</h2><p>This placeholder will be replaced by the 3D viewer. It already reflects the model data path.</p></div>
        <div className="placeholder-box">Metal Building: {building.width} x {building.length} x {building.eaveHeight} · Roof {building.roofPitch} · Bay {building.baySpacing}<br />Roof: {building.roofColor} · Wall: {building.wallColor} · Trim: {building.trimColor}</div>
      </div>

      <div className="card">
        <div className="section-heading"><Badge>Component Library</Badge><h2>Renderable Components</h2><p>Doors, windows, roof, wall, trim, structural, and accessory components selected here feed the model, estimate, and MBS export.</p></div>
        <div className="module-grid four-up">
          {components.map((component) => (
            <button key={component.id} className={`portal-card workarea-card ${selectedComponentIds.includes(component.id) ? 'active' : ''}`} onClick={() => toggleComponent(component.id)}>
              <Badge>{component.category}</Badge><h3>{component.name}</h3><p>{component.description}</p><small>{component.vendor || component.estimateBucket}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
