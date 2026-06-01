import React, { useMemo, useState } from 'react';

const demoLeads = [
  {
    id: 1,
    label: 'Zillow lead A',
    source: 'Zillow',
    type: 'Buyer Lead',
    contactStatus: 'Phone and email captured',
    stage: 'Hot Lead',
    latestEvent: 'SMS reply received',
    assignedTo: 'Sales Team',
    receivedAt: '9:01 AM',
    firstResponseAt: '9:02 AM',
    nextAction: 'Call back before 10:00 AM',
    score: 92,
    timeline: [
      'Lead received from inbound email parser',
      'Twilio call attempted',
      'SMS delivered',
      'Lead replied by SMS',
      'AI recommended Hot Lead stage',
    ],
  },
  {
    id: 2,
    label: 'Realtor.com lead B',
    source: 'Realtor.com',
    type: 'Seller Lead',
    contactStatus: 'Phone and email captured',
    stage: 'Opened Message',
    latestEvent: 'Tracked email opened',
    assignedTo: 'Sales Team',
    receivedAt: '9:18 AM',
    firstResponseAt: '9:19 AM',
    nextAction: 'Send second text in 15 minutes',
    score: 74,
    timeline: [
      'Lead received from inbound email parser',
      'Twilio call attempted',
      'SMS delivered',
      'Tracked email sent',
      'Email open event recorded',
    ],
  },
  {
    id: 3,
    label: 'Website form lead C',
    source: 'Website Form',
    type: 'Quote Request',
    contactStatus: 'Missing phone',
    stage: 'Needs Review',
    latestEvent: 'Manual review required',
    assignedTo: 'Unassigned',
    receivedAt: '9:41 AM',
    firstResponseAt: 'Email queued',
    nextAction: 'Review missing phone number',
    score: 38,
    timeline: [
      'Website form received',
      'Parser did not find a phone number',
      'Tracked email follow-up queued',
      'AI routed lead to manual review',
    ],
  },
];

const sourcePerformance = [
  { source: 'Zillow', leads: 14, contacted: '93%', hot: 6, appointments: 3 },
  { source: 'Realtor.com', leads: 9, contacted: '89%', hot: 3, appointments: 2 },
  { source: 'Website Forms', leads: 7, contacted: '71%', hot: 2, appointments: 1 },
];

const setupItems = ['Lead inboxes', 'Twilio settings', 'Email tracking', 'Schema fields', 'Merge rules', 'Pipeline routing', 'Audit requirements', 'Handoff rules'];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Metric({ label, value, detail }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function statusTone(value) {
  if (/reply|hot/i.test(value)) return 'green';
  if (/open|deliver|review/i.test(value)) return 'amber';
  return 'dark';
}

export default function CrmLeadCommandCenter() {
  const [activeLeadId, setActiveLeadId] = useState(demoLeads[0].id);
  const [activeView, setActiveView] = useState('Dashboard');
  const activeLead = useMemo(() => demoLeads.find((lead) => lead.id === activeLeadId) || demoLeads[0], [activeLeadId]);
  const hotLeads = demoLeads.filter((lead) => lead.stage === 'Hot Lead').length;
  const openedMessages = demoLeads.filter((lead) => /opened/i.test(lead.latestEvent)).length;
  const replies = demoLeads.filter((lead) => /reply/i.test(lead.latestEvent)).length;

  return (
    <div className="stack">
      <Card>
        <div className="section-heading">
          <Badge tone="red">CRM</Badge>
          <h2>Lead Command Center</h2>
          <p>Leads enter from Zillow, Realtor.com, website forms, or a lead inbox. Before they become normal CRM records, the system calls, texts, sends tracked email, records engagement, and routes the lead to the right pipeline.</p>
        </div>
        <nav className="room-tabs module-tabs">
          {['Dashboard', 'Lead Inbox', 'Conversations', 'Pipeline', 'Reports', 'Settings'].map((view) => <button key={view} className={activeView === view ? 'active' : ''} onClick={() => setActiveView(view)}>{view}</button>)}
        </nav>
      </Card>

      {activeView === 'Dashboard' && <>
        <div className="stats-grid">
          <Metric label="New leads today" value={demoLeads.length} detail="From inbound sources" />
          <Metric label="Hot leads" value={hotLeads} detail="Reply or call connected" />
          <Metric label="Email opened" value={openedMessages} detail="Tracked email engagement" />
          <Metric label="SMS replies" value={replies} detail="Two-way conversations" />
        </div>
        <div className="two-column wide-left">
          <Card>
            <div className="section-heading"><Badge tone="green">Live lead inbox</Badge><h2>Needs attention now</h2><p>Prioritized by response activity, source, urgency, and AI lead score.</p></div>
            <div className="stack">{demoLeads.map((lead) => <article className="queue-item" key={lead.id} onClick={() => setActiveLeadId(lead.id)}><div><strong>{lead.label}</strong><p>{lead.source} • {lead.type} • {lead.assignedTo}</p><Badge tone={statusTone(lead.latestEvent)}>{lead.latestEvent}</Badge></div><div><strong>{lead.score}</strong><small>AI score</small></div></article>)}</div>
          </Card>
          <Card>
            <div className="section-heading"><Badge tone={statusTone(activeLead.stage)}>{activeLead.stage}</Badge><h2>{activeLead.label}</h2><p>{activeLead.nextAction}</p></div>
            <div className="profile-grid"><div><span>Source</span><strong>{activeLead.source}</strong></div><div><span>Contact</span><strong>{activeLead.contactStatus}</strong></div><div><span>Response</span><strong>{activeLead.firstResponseAt}</strong></div><div><span>Owner</span><strong>{activeLead.assignedTo}</strong></div></div>
            <div className="document-box"><h3>AI summary</h3><p>{activeLead.source} lead is in {activeLead.stage}. Latest engagement: {activeLead.latestEvent}. Recommended next action: {activeLead.nextAction}.</p></div>
          </Card>
        </div>
        <div className="two-column">
          <Card><div className="section-heading"><Badge>Lead timeline</Badge><h2>{activeLead.label}</h2></div><div className="stack">{activeLead.timeline.map((event, index) => <article className="queue-item" key={event}><Badge>{index + 1}</Badge><p>{event}</p></article>)}</div></Card>
          <Card><div className="section-heading"><Badge>Automation</Badge><h2>Before CRM routing</h2></div><p>New phone lead: call immediately and send SMS. New email lead: send tracked email. Replies and answered calls move leads up. Missing contact details go to review.</p><div className="warning-box">SMS tracks sent, delivered, failed, replies, and link clicks. Email can track opens/clicks when the system sends the email.</div></Card>
        </div>
      </>}

      {activeView === 'Lead Inbox' && <Card><div className="section-heading"><Badge>Lead Inbox</Badge><h2>Inbound sources</h2><p>Zillow, Realtor.com, website forms, and lead email inboxes feed this queue before CRM routing.</p></div><div className="module-grid four-up">{['Zillow inbox', 'Realtor.com inbox', 'Website forms', 'Manual imports'].map((source) => <article className="module" key={source}><Badge tone="green">Active</Badge><h3>{source}</h3><p>Parse lead fields, detect duplicates, queue response, then route.</p></article>)}</div></Card>}
      {activeView === 'Conversations' && <Card><div className="section-heading"><Badge>Conversations</Badge><h2>Calls, texts, email, opens, clicks</h2><p>Every communication event is stored on the lead timeline.</p></div><div className="module-grid four-up">{['Call connected', 'Call missed', 'SMS delivered', 'SMS replied', 'Email opened', 'Email clicked'].map((event) => <article className="module" key={event}><Badge>{event}</Badge><h3>{event}</h3><p>Used for lead score, pipeline movement, and next action recommendations.</p></article>)}</div></Card>}
      {activeView === 'Pipeline' && <Card><div className="section-heading"><Badge>Pipeline</Badge><h2>Routing stages</h2><p>Leads move automatically based on engagement.</p></div><div className="module-grid four-up">{['New Lead', 'Hot Lead', 'Opened Message', 'Follow Up', 'Appointment Set', 'Needs Review'].map((stage) => <article className="module" key={stage}><Badge tone="green">Stage</Badge><h3>{stage}</h3><p>Movement is based on call, SMS, email, reply, source, and AI score.</p></article>)}</div></Card>}
      {activeView === 'Reports' && <Card><div className="section-heading"><Badge>Reports</Badge><h2>Source performance</h2><p>Show which sources produce leads that answer, reply, book, and close.</p></div><div className="module-grid four-up">{sourcePerformance.map((source) => <article className="module" key={source.source}><Badge>{source.source}</Badge><h3>{source.leads} leads</h3><p>{source.contacted} contacted • {source.hot} hot • {source.appointments} appointments</p></article>)}</div></Card>}
      {activeView === 'Settings' && <Card><div className="section-heading"><Badge tone="amber">Admin setup</Badge><h2>CRM setup belongs here</h2><p>Schema, imports, merge rules, audit requirements, approval gates, and handoffs live in settings, not on the main CRM dashboard.</p></div><div className="module-grid four-up">{setupItems.map((item) => <article className="module" key={item}><Badge>Settings</Badge><h3>{item}</h3><p>Admin-only configuration.</p></article>)}</div></Card>}
    </div>
  );
}
