import React, { useMemo, useState } from 'react';

const demoCustomers = [
  {
    id: 1,
    company: 'Acme Steel Supply',
    contact: 'Jordan Miles',
    type: 'Customer',
    phone: '(555) 014-1188',
    email: 'jordan@acmesteel.example',
    location: 'Pittsburgh, PA',
    status: 'Active',
    updatedAt: 'Today',
    work: 'Structural steel supply and fabrication support.',
    notes: 'Prefers email for quotes. Keep project notes tied to the customer record.',
    internalNotes: 'Good repeat customer. Confirm lead times before committing dates.',
  },
  {
    id: 2,
    company: 'North Ridge Builders',
    contact: 'Taylor Grant',
    type: 'General Contractor',
    phone: '(555) 018-4472',
    email: 'taylor@northridge.example',
    location: 'Cleveland, OH',
    status: 'Prospect',
    updatedAt: 'Yesterday',
    work: 'Commercial construction projects and subcontractor coordination.',
    notes: 'Interested in bid support for upcoming warehouse projects.',
    internalNotes: 'Needs clean estimate history before handoff to sales.',
  },
  {
    id: 3,
    company: 'Summit Industrial',
    contact: 'Morgan Lee',
    type: 'Industrial Client',
    phone: '(555) 016-9090',
    email: 'morgan@summitindustrial.example',
    location: 'Columbus, OH',
    status: 'Active',
    updatedAt: 'May 28',
    work: 'Plant maintenance, platforms, rails, and miscellaneous metals.',
    notes: 'Usually sends work in phases. Track drawings and approvals carefully.',
    internalNotes: 'High-value account. Keep documentation tight.',
  },
];

const crmTools = [
  'Live Lead Inbox',
  'Lead Timeline',
  'Inbound Leads',
  'AI Communication',
  'Website Intelligence',
  'Website Optimizer',
  'CRM Audit',
  'CRM Handoffs',
  'Create CRM Draft',
  'Master Records',
  'Hardening Checklist',
];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function CrmLeadCommandCenter() {
  const [activeCustomerId, setActiveCustomerId] = useState(demoCustomers[0].id);
  const [toolsOpen, setToolsOpen] = useState(false);
  const activeCustomer = useMemo(
    () => demoCustomers.find((customer) => customer.id === activeCustomerId) || demoCustomers[0],
    [activeCustomerId]
  );

  return (
    <div className="crm-room-shell">
      <Card className="crm-hero-card">
        <div className="section-heading">
          <Badge tone="red">CRM</Badge>
          <h2>Customer List</h2>
          <p>Open CRM to a clean customer database first. Lead tools, AI communication, audits, handoffs, and optimizer workflows stay tucked away until they are needed.</p>
        </div>
        <button className="primary" type="button" onClick={() => setToolsOpen((value) => !value)}>
          {toolsOpen ? 'Hide CRM Tools' : 'CRM Tools'}
        </button>
        {toolsOpen && (
          <div className="crm-tools-menu" aria-label="CRM tools menu">
            {crmTools.map((tool) => <button type="button" key={tool}>{tool}</button>)}
          </div>
        )}
      </Card>

      <div className="crm-wide-grid">
        <Card className="crm-list-card">
          <div className="section-heading compact-heading">
            <Badge>Customers</Badge>
            <h2>Customer List</h2>
          </div>
          <div className="customer-table" role="table" aria-label="Customer list">
            <div className="customer-table-row customer-table-head" role="row">
              <span>Company</span>
              <span>Contact</span>
              <span>Type</span>
              <span>Phone</span>
              <span>Email</span>
              <span>Status</span>
              <span>Last Updated</span>
              <span>Action</span>
            </div>
            {demoCustomers.map((customer) => (
              <div className="customer-table-row" role="row" key={customer.id}>
                <strong>{customer.company}</strong>
                <span>{customer.contact}</span>
                <span>{customer.type}</span>
                <span>{customer.phone}</span>
                <span>{customer.email}</span>
                <Badge tone={customer.status === 'Active' ? 'green' : 'amber'}>{customer.status}</Badge>
                <span>{customer.updatedAt}</span>
                <button type="button" onClick={() => setActiveCustomerId(customer.id)}>Open</button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="crm-wide-card">
          <div className="section-heading compact-heading">
            <Badge tone="green">Customer Record</Badge>
            <h2>{activeCustomer.company}</h2>
          </div>
          <div className="customer-form-grid">
            <Field label="Company Name"><input value={activeCustomer.company} readOnly /></Field>
            <Field label="Primary Contact"><input value={activeCustomer.contact} readOnly /></Field>
            <Field label="Customer Type"><input value={activeCustomer.type} readOnly /></Field>
            <Field label="Phone"><input value={activeCustomer.phone} readOnly /></Field>
            <Field label="Email"><input value={activeCustomer.email} readOnly /></Field>
            <Field label="Address / Location"><input value={activeCustomer.location} readOnly /></Field>
            <Field label="Status"><input value={activeCustomer.status} readOnly /></Field>
            <Field label="What They Do"><textarea rows="3" value={activeCustomer.work} readOnly /></Field>
            <Field label="Notes"><textarea rows="3" value={activeCustomer.notes} readOnly /></Field>
            <Field label="Internal Notes"><textarea rows="3" value={activeCustomer.internalNotes} readOnly /></Field>
          </div>
          <div className="crm-form-actions">
            <button className="primary" type="button">Save Customer</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
