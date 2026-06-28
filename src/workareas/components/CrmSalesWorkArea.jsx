import React, { useMemo, useState } from 'react';
import CrmLeadCommandCenter from '../../CrmLeadCommandCenter.jsx';
import { publishActivity } from '../runtime/activity-publisher.ts';
import { createTimelineFromRuntime, appendTimelineEvent } from '../runtime/timeline-binding.ts';

const followUpOptions = [7, 15, 30, 60, 90];

const initialLead = {
  leadSource: 'Website / Bid Invitation',
  customer: 'ACME Corp',
  generalContractor: 'ACME Corp',
  architect: '',
  bidDueDate: 'Friday',
  quoteStatus: 'Estimating',
  estimator: 'Seth McBride',
  salesperson: 'Seth McBride',
  projectDescription: 'Pre-engineered metal building quote',
};

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function TextInput({ value, onChange, placeholder = '' }) {
  return <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export default function CrmSalesWorkArea({ runtime }) {
  const [lead, setLead] = useState(initialLead);
  const [selectedFollowUps, setSelectedFollowUps] = useState([7, 15, 30]);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('lead');

  const timeline = useMemo(() => createTimelineFromRuntime(runtime.state, events), [runtime.state, events]);
  const recordNumber = runtime.project.projectNumber || runtime.project.quoteNumber || runtime.project.id;
  const recordLabel = runtime.project.projectNumber ? 'Project Record' : 'Quote Record';

  function updateLead(field, value) {
    setLead((current) => ({ ...current, [field]: value }));
  }

  function toggleFollowUp(days) {
    setSelectedFollowUps((current) => current.includes(days) ? current.filter((item) => item !== days) : [...current, days]);
  }

  async function saveLeadActivity() {
    const event = await publishActivity({
      projectId: runtime.project.id,
      type: 'crm.lead.updated',
      title: `CRM quote updated for ${lead.customer}`,
      body: `${recordNumber} · ${lead.quoteStatus} · Estimator: ${lead.estimator} · Bid due: ${lead.bidDueDate}`,
      userId: lead.salesperson,
    });
    setEvents((current) => appendTimelineEvent(timeline, event).events);
  }

  return (
    <section className="card crm-sales-workarea">
      <div className="section-heading">
        <Badge tone="green">CRM & Sales</Badge>
        <h2>Lead Intake Through Quote</h2>
        <p>Leads and opportunities stay as quote records until award. An SCB project number is only generated after contract or PO.</p>
      </div>

      <nav className="room-tabs module-tabs" aria-label="CRM Sales work area view selector">
        <button type="button" className={view === 'lead' ? 'active' : ''} onClick={() => setView('lead')}>Quote Intake</button>
        <button type="button" className={view === 'accounts' ? 'active' : ''} onClick={() => setView('accounts')}>Accounts / Contacts</button>
        <button type="button" className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Activity</button>
      </nav>

      {view === 'lead' && (
        <>
          <div className="employee-context">
            <Field label="Lead Source"><TextInput value={lead.leadSource} onChange={(value) => updateLead('leadSource', value)} /></Field>
            <Field label="Customer"><TextInput value={lead.customer} onChange={(value) => updateLead('customer', value)} /></Field>
            <Field label="General Contractor"><TextInput value={lead.generalContractor} onChange={(value) => updateLead('generalContractor', value)} /></Field>
            <Field label="Architect"><TextInput value={lead.architect} onChange={(value) => updateLead('architect', value)} placeholder="Optional" /></Field>
            <Field label="Bid Due Date"><TextInput value={lead.bidDueDate} onChange={(value) => updateLead('bidDueDate', value)} /></Field>
            <Field label="Quote Status">
              <select value={lead.quoteStatus} onChange={(event) => updateLead('quoteStatus', event.target.value)}>
                <option>Lead</option>
                <option>Qualified</option>
                <option>Estimating</option>
                <option>Proposal Sent</option>
                <option>Follow Up</option>
                <option>Negotiation</option>
                <option>Awarded</option>
                <option>Contract Executed</option>
              </select>
            </Field>
            <Field label="Estimator"><TextInput value={lead.estimator} onChange={(value) => updateLead('estimator', value)} /></Field>
            <Field label="Salesperson"><TextInput value={lead.salesperson} onChange={(value) => updateLead('salesperson', value)} /></Field>
          </div>

          <div className="module-grid four-up">
            <article className="module">
              <Badge>Pipeline</Badge>
              <h3>{lead.quoteStatus}</h3>
              <p>Lead → Qualified → Estimating → Proposal Sent → Follow Up → Negotiation → Awarded → Contract Executed.</p>
            </article>
            <article className="module">
              <Badge>{recordLabel}</Badge>
              <h3>{recordNumber}</h3>
              <p>CRM and estimating start as a quote record. Delivery, billing, and erection attach only after award creates an SCB project.</p>
            </article>
            <article className="module">
              <Badge>Proposal History</Badge>
              <h3>Ready</h3>
              <p>Proposal versions and sent history remain attached to this quote opportunity.</p>
            </article>
            <article className="module">
              <Badge>Emails</Badge>
              <h3>Templates</h3>
              <p>Pre-built follow-up email templates connect to the selected reminders.</p>
            </article>
          </div>

          <div className="card">
            <div className="section-heading">
              <Badge>Follow-Ups</Badge>
              <h2>Reminder Schedule</h2>
              <p>Select the follow-up reminders that should be created for this opportunity.</p>
            </div>
            <div className="room-tabs module-tabs">
              {followUpOptions.map((days) => (
                <button key={days} className={selectedFollowUps.includes(days) ? 'active' : ''} onClick={() => toggleFollowUp(days)}>
                  {days} day follow-up
                </button>
              ))}
            </div>
            <button className="primary auth-button" onClick={saveLeadActivity}>Save CRM Activity</button>
          </div>
        </>
      )}

      {view === 'accounts' && <CrmLeadCommandCenter />}

      {view === 'timeline' && (
        <div className="card">
          <div className="section-heading">
            <Badge>Timeline</Badge>
            <h2>CRM Activity</h2>
            <p>Every milestone creates an activity entry tied to the quote record until the job is awarded.</p>
          </div>
          <div className="placeholder-box">
            {timeline.events.length ? timeline.events.map((event) => <p key={event.id}><strong>{event.title}</strong><br />{event.body}</p>) : 'No CRM activity saved yet.'}
          </div>
        </div>
      )}
    </section>
  );
}
