import React, { useMemo, useState } from 'react';
import './crm.css';

const customers = [
  {
    id: 1,
    company: 'Acme Steel Supply',
    contact: 'Jordan Miles',
    type: 'Customer',
    phone: '(555) 014-1188',
    email: 'jordan@acmesteel.com',
    location: 'Pittsburgh, PA',
    status: 'Active',
    owner: 'Sales Team',
    activity: 'Quote updated today',
    value: '$84,200',
    work: 'Structural steel supply and fabrication support for commercial projects.',
    notes: 'Prefers email for quotes. Keep project notes tied to this customer record.',
  },
  {
    id: 2,
    company: 'North Ridge Builders',
    contact: 'Taylor Grant',
    type: 'General Contractor',
    phone: '(555) 018-4472',
    email: 'taylor@northridgebuilders.com',
    location: 'Cleveland, OH',
    status: 'Prospect',
    owner: 'Estimating',
    activity: 'Bid request received',
    value: '$142,000',
    work: 'Commercial construction projects and subcontractor coordination.',
    notes: 'Interested in bid support for upcoming warehouse projects.',
  },
  {
    id: 3,
    company: 'Summit Industrial',
    contact: 'Morgan Lee',
    type: 'Industrial Client',
    phone: '(555) 016-9090',
    email: 'morgan@summitindustrial.com',
    location: 'Columbus, OH',
    status: 'Active',
    owner: 'Operations',
    activity: 'Maintenance scope reviewed',
    value: '$63,500',
    work: 'Plant maintenance, platforms, rails, and miscellaneous metals.',
    notes: 'Usually sends work in phases. Track drawings and approvals carefully.',
  },
];

const hiddenTools = ['Lead Inbox', 'Timeline', 'Inbound Leads', 'AI Communication', 'Website Intelligence', 'Website Optimizer', 'CRM Audit', 'Handoffs', 'Master Records'];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function statusTone(status) {
  if (status === 'Active') return 'green';
  if (status === 'Prospect') return 'amber';
  return 'dark';
}

export default function CrmLeadCommandCenter() {
  const [activeCustomerId, setActiveCustomerId] = useState(customers[0].id);
  const [query, setQuery] = useState('');
  const [showTools, setShowTools] = useState(false);

  const filteredCustomers = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return customers;
    return customers.filter((customer) => [customer.company, customer.contact, customer.type, customer.phone, customer.email, customer.location, customer.status, customer.owner].some((value) => value.toLowerCase().includes(cleanQuery)));
  }, [query]);

  const activeCustomer = useMemo(() => customers.find((customer) => customer.id === activeCustomerId) || customers[0], [activeCustomerId]);

  return (
    <section className="crm-workspace" aria-label="Contacts CRM customer records">
      <div className="crm-toolbar">
        <div>
          <Badge tone="red">CRM</Badge>
          <h2>Customers</h2>
          <p>Company records, contacts, account ownership, activity, and notes.</p>
        </div>
        <div className="crm-toolbar-actions">
          <input aria-label="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers, contacts, email, status..." />
          <button className="primary" type="button">Add Customer</button>
          <button type="button" onClick={() => setShowTools((value) => !value)}>More</button>
        </div>
        {showTools && <div className="crm-more-menu">{hiddenTools.map((tool) => <button type="button" key={tool}>{tool}</button>)}</div>}
      </div>

      <div className="crm-summary-row" aria-label="CRM summary">
        <article><span>Total customers</span><strong>{customers.length}</strong></article>
        <article><span>Active accounts</span><strong>{customers.filter((customer) => customer.status === 'Active').length}</strong></article>
        <article><span>Open value</span><strong>$289.7k</strong></article>
        <article><span>Needs review</span><strong>0</strong></article>
      </div>

      <div className="crm-record-layout">
        <div className="crm-table-card">
          <div className="crm-table-title"><h3>Customer List</h3><span>{filteredCustomers.length} shown</span></div>
          <div className="customer-table professional-table" role="table" aria-label="Customer list">
            <div className="customer-table-row customer-table-head" role="row">
              <span>Company</span><span>Contact</span><span>Type</span><span>Status</span><span>Owner</span><span>Last Activity</span><span>Open Value</span><span></span>
            </div>
            {filteredCustomers.map((customer) => (
              <button className={`customer-table-row customer-record-row ${activeCustomer.id === customer.id ? 'selected' : ''}`} role="row" type="button" key={customer.id} onClick={() => setActiveCustomerId(customer.id)}>
                <strong>{customer.company}</strong><span>{customer.contact}</span><span>{customer.type}</span><Badge tone={statusTone(customer.status)}>{customer.status}</Badge><span>{customer.owner}</span><span>{customer.activity}</span><strong>{customer.value}</strong><span className="open-record-text">Open</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="crm-record-panel" aria-label="Customer record">
          <div className="record-panel-header"><Badge tone={statusTone(activeCustomer.status)}>{activeCustomer.status}</Badge><h3>{activeCustomer.company}</h3><p>{activeCustomer.work}</p></div>
          <div className="customer-form-grid clean-record-form">
            <Field label="Company"><input value={activeCustomer.company} readOnly /></Field>
            <Field label="Primary Contact"><input value={activeCustomer.contact} readOnly /></Field>
            <Field label="Customer Type"><input value={activeCustomer.type} readOnly /></Field>
            <Field label="Owner"><input value={activeCustomer.owner} readOnly /></Field>
            <Field label="Phone"><input value={activeCustomer.phone} readOnly /></Field>
            <Field label="Email"><input value={activeCustomer.email} readOnly /></Field>
            <Field label="Location"><input value={activeCustomer.location} readOnly /></Field>
            <Field label="Open Value"><input value={activeCustomer.value} readOnly /></Field>
            <Field label="Notes"><textarea rows="3" value={activeCustomer.notes} readOnly /></Field>
          </div>
          <div className="crm-form-actions"><button type="button">Edit Record</button><button className="primary" type="button">Save</button></div>
        </aside>
      </div>
    </section>
  );
}
