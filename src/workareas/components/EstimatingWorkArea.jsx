import React, { useMemo, useState } from 'react';
import { getActiveEstimateTemplates } from '../registry/estimate-template-registry.ts';
import { publishActivity } from '../runtime/activity-publisher.ts';
import { createTimelineFromRuntime, appendTimelineEvent } from '../runtime/timeline-binding.ts';

const manufacturerOptions = ['Whirlwind', 'Nucor', 'Chief', 'Metallic', 'Hornet', 'Other'];

const initialEstimate = {
  manufacturer: 'Whirlwind',
  quotePdfName: '',
  buildingCost: 0,
  localTaxRate: 0,
  markupPercent: 18,
  freight: 0,
  engineering: 0,
  laborCost: 0,
  subcontractCost: 0,
  contingency: 0,
  squareFeet: 0,
  alternate1: 0,
  alternate2: 0,
  alternate3: 0,
};

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

export default function EstimatingWorkArea({ runtime }) {
  const templates = getActiveEstimateTemplates();
  const [estimate, setEstimate] = useState(initialEstimate);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('template');

  const timeline = useMemo(() => createTimelineFromRuntime(runtime.state, events), [runtime.state, events]);
  const recordNumber = runtime.project.projectNumber || runtime.project.quoteNumber || runtime.project.id;
  const subtotal = numberValue(estimate.buildingCost) + numberValue(estimate.freight) + numberValue(estimate.engineering) + numberValue(estimate.laborCost) + numberValue(estimate.subcontractCost) + numberValue(estimate.contingency);
  const tax = numberValue(estimate.buildingCost) * (numberValue(estimate.localTaxRate) / 100);
  const alternates = numberValue(estimate.alternate1) + numberValue(estimate.alternate2) + numberValue(estimate.alternate3);
  const markup = (subtotal + tax + alternates) * (numberValue(estimate.markupPercent) / 100);
  const total = subtotal + tax + alternates + markup;
  const costPerSf = numberValue(estimate.squareFeet) ? total / numberValue(estimate.squareFeet) : 0;

  function updateEstimate(field, value) {
    setEstimate((current) => ({ ...current, [field]: value }));
  }

  async function saveEstimateActivity() {
    const event = await publishActivity({
      projectId: runtime.project.id,
      type: 'estimate.template.updated',
      title: `Estimate updated for ${recordNumber}`,
      body: `Template-driven estimate saved. Total: ${money(total)} · Markup: ${estimate.markupPercent}%`,
      userId: runtime.project.estimator,
    });
    setEvents((current) => appendTimelineEvent(timeline, event).events);
  }

  return (
    <section className="card estimating-workarea">
      <div className="section-heading">
        <Badge tone="green">Estimating</Badge>
        <h2>Template-Driven Estimate Builder</h2>
        <p>The uploaded templates are the source of truth. The UI is a guided workflow, not a spreadsheet clone.</p>
      </div>

      <nav className="room-tabs module-tabs" aria-label="Estimating view selector">
        <button type="button" className={view === 'template' ? 'active' : ''} onClick={() => setView('template')}>Template Library</button>
        <button type="button" className={view === 'import' ? 'active' : ''} onClick={() => setView('import')}>Manufacturer Quote</button>
        <button type="button" className={view === 'worksheet' ? 'active' : ''} onClick={() => setView('worksheet')}>Worksheet</button>
        <button type="button" className={view === 'summary' ? 'active' : ''} onClick={() => setView('summary')}>Generated Summary</button>
      </nav>

      {view === 'template' && (
        <div className="module-grid four-up">
          {templates.map((template) => (
            <article className="module" key={template.id}>
              <Badge tone={template.active ? 'green' : 'dark'}>{template.kind}</Badge>
              <h3>{template.title}</h3>
              <p>{template.description}</p>
              <small>{template.sourceFileName} · v{template.version}</small>
            </article>
          ))}
        </div>
      )}

      {view === 'import' && (
        <div className="card">
          <div className="section-heading">
            <Badge>Manufacturer Quote Import</Badge>
            <h2>Upload PDF Quote</h2>
            <p>PDF extraction maps manufacturer data into the approved template fields. Manual review stays required before proposal output.</p>
          </div>
          <div className="employee-context">
            <Field label="Manufacturer">
              <select value={estimate.manufacturer} onChange={(event) => updateEstimate('manufacturer', event.target.value)}>
                {manufacturerOptions.map((manufacturer) => <option key={manufacturer}>{manufacturer}</option>)}
              </select>
            </Field>
            <Field label="Quote PDF Name"><input value={estimate.quotePdfName} onChange={(event) => updateEstimate('quotePdfName', event.target.value)} placeholder="Whirlwind quote PDF" /></Field>
            <article className="module">
              <Badge tone="red">Guardrail</Badge>
              <h3>Template Required</h3>
              <p>No estimate output is generated unless an approved template is active.</p>
            </article>
          </div>
        </div>
      )}

      {view === 'worksheet' && (
        <div className="card">
          <div className="section-heading">
            <Badge>Guided Inputs</Badge>
            <h2>Estimate Worksheet</h2>
            <p>Editable template inputs feed generated totals. The generated values are shown in the summary card.</p>
          </div>
          <div className="employee-context">
            <Field label="Building Cost"><input type="number" value={estimate.buildingCost} onChange={(event) => updateEstimate('buildingCost', event.target.value)} /></Field>
            <Field label="Local Tax Rate %"><input type="number" value={estimate.localTaxRate} onChange={(event) => updateEstimate('localTaxRate', event.target.value)} /></Field>
            <Field label="Markup %"><input type="number" value={estimate.markupPercent} onChange={(event) => updateEstimate('markupPercent', event.target.value)} /></Field>
            <Field label="Freight"><input type="number" value={estimate.freight} onChange={(event) => updateEstimate('freight', event.target.value)} /></Field>
            <Field label="Engineering"><input type="number" value={estimate.engineering} onChange={(event) => updateEstimate('engineering', event.target.value)} /></Field>
            <Field label="Labor Cost"><input type="number" value={estimate.laborCost} onChange={(event) => updateEstimate('laborCost', event.target.value)} /></Field>
            <Field label="Subcontract Cost"><input type="number" value={estimate.subcontractCost} onChange={(event) => updateEstimate('subcontractCost', event.target.value)} /></Field>
            <Field label="Contingency"><input type="number" value={estimate.contingency} onChange={(event) => updateEstimate('contingency', event.target.value)} /></Field>
            <Field label="Square Feet"><input type="number" value={estimate.squareFeet} onChange={(event) => updateEstimate('squareFeet', event.target.value)} /></Field>
            <Field label="Alternate 1"><input type="number" value={estimate.alternate1} onChange={(event) => updateEstimate('alternate1', event.target.value)} /></Field>
            <Field label="Alternate 2"><input type="number" value={estimate.alternate2} onChange={(event) => updateEstimate('alternate2', event.target.value)} /></Field>
            <Field label="Alternate 3"><input type="number" value={estimate.alternate3} onChange={(event) => updateEstimate('alternate3', event.target.value)} /></Field>
          </div>
          <button className="primary auth-button" type="button" onClick={saveEstimateActivity}>Save Estimate Activity</button>
        </div>
      )}

      {view === 'summary' && (
        <div className="module-grid four-up">
          <article className="module"><Badge>Quote</Badge><h3>{recordNumber}</h3><p>Estimate remains attached to the quote until award.</p></article>
          <article className="module"><Badge>Subtotal</Badge><h3>{money(subtotal)}</h3><p>Building, freight, engineering, labor, subcontract, and contingency.</p></article>
          <article className="module"><Badge>Markup</Badge><h3>{money(markup)}</h3><p>{estimate.markupPercent}% default markup is editable.</p></article>
          <article className="module"><Badge tone="green">Total</Badge><h3>{money(total)}</h3><p>{costPerSf ? `${money(costPerSf)} / SF` : 'Add square footage for cost per SF.'}</p></article>
          <article className="module"><Badge>Alternates</Badge><h3>{money(alternates)}</h3><p>Accepted alternates move into the base contract after award.</p></article>
          <article className="module"><Badge>Tax</Badge><h3>{money(tax)}</h3><p>Generated from building cost and local tax rate.</p></article>
          <article className="module"><Badge>Timeline</Badge><h3>{timeline.events.length}</h3><p>Estimate activity entries saved for this quote.</p></article>
          <article className="module"><Badge tone="red">Locked Output</Badge><h3>Template Controlled</h3><p>Generated totals should not be free typed.</p></article>
        </div>
      )}
    </section>
  );
}
