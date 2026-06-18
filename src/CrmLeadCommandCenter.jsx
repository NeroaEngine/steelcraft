import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiSend } from './api.js';
import './crm.css';

const fallbackAccounts = [
  {
    id: 'demo-1',
    accountName: 'CRM data not synced yet',
    accountType: 'Setup',
    domain: '',
    industry: '',
    headquartersLocation: '',
    description: 'Run Monday CRM sync to pull Accounts and Contacts into this screen.',
    mondayItemId: '',
  },
];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function clean(value = '') {
  return String(value || '').trim();
}

function accountName(account) {
  return account.accountName || account.company || account.name || '';
}

function contactName(contact) {
  return contact.fullName || contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || '';
}

function matchAccountText(contact) {
  return contact.accountName || contact.linkedAccountText || contact.companyText || '';
}

function toneForType(type = '') {
  const value = type.toLowerCase();
  if (value.includes('general contractor')) return 'green';
  if (value.includes('architect') || value.includes('engineer')) return 'amber';
  if (value.includes('supplier') || value.includes('vendor') || value.includes('fabricator')) return 'red';
  return 'dark';
}

export default function CrmLeadCommandCenter() {
  const [accounts, setAccounts] = useState(fallbackAccounts);
  const [contacts, setContacts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(fallbackAccounts[0].id);
  const [activeContactId, setActiveContactId] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Loading CRM Accounts and Contacts...');
  const [syncStatus, setSyncStatus] = useState('');
  const [view, setView] = useState('accounts');

  async function refreshCrm() {
    try {
      const [nextAccounts, nextContacts] = await Promise.all([
        apiGet('/api/crm/accounts'),
        apiGet('/api/crm/contacts'),
      ]);
      const safeAccounts = Array.isArray(nextAccounts) && nextAccounts.length ? nextAccounts : fallbackAccounts;
      const safeContacts = Array.isArray(nextContacts) ? nextContacts : [];
      setAccounts(safeAccounts);
      setContacts(safeContacts);
      setActiveAccountId((current) => safeAccounts.some((account) => String(account.id) === String(current)) ? current : safeAccounts[0]?.id);
      setActiveContactId((current) => current && safeContacts.some((contact) => String(contact.id) === String(current)) ? current : safeContacts[0]?.id || null);
      setStatus(`Loaded ${safeAccounts === fallbackAccounts ? 0 : safeAccounts.length} accounts and ${safeContacts.length} contacts`);
    } catch (error) {
      setAccounts(fallbackAccounts);
      setContacts([]);
      setStatus(`CRM API not ready: ${error.message}`);
    }
  }

  async function runSync() {
    setSyncStatus('Syncing Monday Accounts and Contacts...');
    try {
      const result = await apiSend('/api/monday/sync-crm', 'POST', {});
      setSyncStatus(`Sync complete: ${result.accountsImported || 0} accounts, ${result.contactsImported || 0} contacts, ${result.contactsMatched || 0} matched, ${result.contactsUnmatched || 0} unmatched.`);
      await refreshCrm();
    } catch (error) {
      setSyncStatus(`Sync failed: ${error.message}`);
    }
  }

  useEffect(() => {
    refreshCrm();
  }, []);

  const filteredAccounts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return accounts;
    return accounts.filter((account) => [accountName(account), account.accountType, account.domain, account.industry, account.headquartersLocation, account.description, account.mondayItemId].some((value) => clean(value).toLowerCase().includes(cleanQuery)));
  }, [accounts, query]);

  const filteredContacts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return contacts;
    return contacts.filter((contact) => [contactName(contact), contact.contactType, contact.title, contact.phone, contact.email, matchAccountText(contact), contact.mondayItemId].some((value) => clean(value).toLowerCase().includes(cleanQuery)));
  }, [contacts, query]);

  const activeAccount = useMemo(() => accounts.find((account) => String(account.id) === String(activeAccountId)) || accounts[0] || fallbackAccounts[0], [accounts, activeAccountId]);
  const accountContacts = useMemo(() => contacts.filter((contact) => String(contact.accountId || '') === String(activeAccount?.id || '')), [contacts, activeAccount]);
  const activeContact = useMemo(() => contacts.find((contact) => String(contact.id) === String(activeContactId)) || accountContacts[0] || contacts[0] || null, [contacts, activeContactId, accountContacts]);

  useEffect(() => {
    async function loadNotes() {
      if (!activeContact?.id) {
        setNotes([]);
        return;
      }
      try {
        const nextNotes = await apiGet(`/api/crm/contacts/${activeContact.id}/notes`);
        setNotes(Array.isArray(nextNotes) ? nextNotes : []);
      } catch (_error) {
        setNotes([]);
      }
    }
    loadNotes();
  }, [activeContact?.id]);

  return (
    <section className="crm-workspace" aria-label="Steel Craft Monday CRM Accounts and Contacts">
      <div className="crm-toolbar">
        <div>
          <Badge tone="red">Monday CRM</Badge>
          <h2>Accounts and Contacts</h2>
          <p>Live CRM records pulled from Monday: Accounts, Contacts, linked companies, comments, updates, and subitems.</p>
          <p className="connection-status">{status}</p>
          {syncStatus && <p className="connection-status">{syncStatus}</p>}
        </div>
        <div className="crm-toolbar-actions">
          <input aria-label="Search CRM" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts, contacts, emails, types..." />
          <button className="primary" type="button" onClick={runSync}>Sync Monday CRM</button>
          <button type="button" onClick={refreshCrm}>Refresh</button>
        </div>
      </div>

      <div className="crm-summary-row" aria-label="CRM summary">
        <article><span>Accounts</span><strong>{accounts === fallbackAccounts ? 0 : accounts.length}</strong></article>
        <article><span>Contacts</span><strong>{contacts.length}</strong></article>
        <article><span>Matched contacts</span><strong>{contacts.filter((contact) => contact.accountId).length}</strong></article>
        <article><span>Unmatched</span><strong>{contacts.filter((contact) => !contact.accountId).length}</strong></article>
      </div>

      <nav className="room-tabs module-tabs" aria-label="CRM view selector">
        <button type="button" className={view === 'accounts' ? 'active' : ''} onClick={() => setView('accounts')}>Accounts</button>
        <button type="button" className={view === 'contacts' ? 'active' : ''} onClick={() => setView('contacts')}>Contacts</button>
        <button type="button" className={view === 'notes' ? 'active' : ''} onClick={() => setView('notes')}>Contact Notes</button>
      </nav>

      {view === 'accounts' && (
        <div className="crm-record-layout">
          <div className="crm-table-card">
            <div className="crm-table-title"><h3>Accounts Board</h3><span>{filteredAccounts.length} shown</span></div>
            <div className="customer-table professional-table" role="table" aria-label="Accounts list">
              <div className="customer-table-row customer-table-head" role="row">
                <span>Account</span><span>Type</span><span>Domain</span><span>Industry</span><span>Location</span><span>Monday ID</span><span></span>
              </div>
              {filteredAccounts.map((account) => (
                <button className={`customer-table-row customer-record-row ${String(activeAccount.id) === String(account.id) ? 'selected' : ''}`} role="row" type="button" key={account.id} onClick={() => { setActiveAccountId(account.id); setView('accounts'); }}>
                  <strong>{accountName(account)}</strong><Badge tone={toneForType(account.accountType)}>{account.accountType || 'Account'}</Badge><span>{account.domain || '-'}</span><span>{account.industry || '-'}</span><span>{account.headquartersLocation || '-'}</span><span>{account.mondayItemId || '-'}</span><span className="open-record-text">Open</span>
                </button>
              ))}
            </div>
          </div>

          <aside className="crm-record-panel" aria-label="Account record">
            <div className="record-panel-header"><Badge tone={toneForType(activeAccount.accountType)}>{activeAccount.accountType || 'Account'}</Badge><h3>{accountName(activeAccount)}</h3><p>{activeAccount.description || 'No description loaded yet.'}</p></div>
            <div className="customer-form-grid clean-record-form">
              <Field label="Account"><input value={accountName(activeAccount)} readOnly /></Field>
              <Field label="Type"><input value={activeAccount.accountType || ''} readOnly /></Field>
              <Field label="Domain"><input value={activeAccount.domain || ''} readOnly /></Field>
              <Field label="Industry"><input value={activeAccount.industry || ''} readOnly /></Field>
              <Field label="Employees"><input value={activeAccount.employeeCount || ''} readOnly /></Field>
              <Field label="Headquarters"><input value={activeAccount.headquartersLocation || ''} readOnly /></Field>
              <Field label="Monday Item ID"><input value={activeAccount.mondayItemId || ''} readOnly /></Field>
              <Field label="Linked Contacts"><textarea rows="4" value={accountContacts.map(contactName).join('\n') || 'No matched contacts yet.'} readOnly /></Field>
            </div>
          </aside>
        </div>
      )}

      {view === 'contacts' && (
        <div className="crm-record-layout">
          <div className="crm-table-card">
            <div className="crm-table-title"><h3>Contacts Board</h3><span>{filteredContacts.length} shown</span></div>
            <div className="customer-table professional-table" role="table" aria-label="Contacts list">
              <div className="customer-table-row customer-table-head" role="row">
                <span>Name</span><span>Account</span><span>Type</span><span>Title</span><span>Phone</span><span>Email</span><span></span>
              </div>
              {filteredContacts.map((contact) => (
                <button className={`customer-table-row customer-record-row ${String(activeContact?.id) === String(contact.id) ? 'selected' : ''}`} role="row" type="button" key={contact.id} onClick={() => { setActiveContactId(contact.id); setActiveAccountId(contact.accountId || activeAccountId); }}>
                  <strong>{contactName(contact)}</strong><span>{matchAccountText(contact) || '-'}</span><Badge tone={contact.accountId ? 'green' : 'amber'}>{contact.accountId ? 'Matched' : 'Needs Account'}</Badge><span>{contact.title || '-'}</span><span>{contact.phone || '-'}</span><span>{contact.email || '-'}</span><span className="open-record-text">Open</span>
                </button>
              ))}
            </div>
          </div>

          <aside className="crm-record-panel" aria-label="Contact record">
            <div className="record-panel-header"><Badge tone={activeContact?.accountId ? 'green' : 'amber'}>{activeContact?.accountId ? 'Matched' : 'Unmatched'}</Badge><h3>{activeContact ? contactName(activeContact) : 'No contact selected'}</h3><p>{activeContact ? matchAccountText(activeContact) || 'No linked account' : 'Run the Monday sync to load contacts.'}</p></div>
            <div className="customer-form-grid clean-record-form">
              <Field label="Contact"><input value={activeContact ? contactName(activeContact) : ''} readOnly /></Field>
              <Field label="Linked Account"><input value={activeContact ? matchAccountText(activeContact) : ''} readOnly /></Field>
              <Field label="Type"><input value={activeContact?.contactType || ''} readOnly /></Field>
              <Field label="Title"><input value={activeContact?.title || ''} readOnly /></Field>
              <Field label="Phone"><input value={activeContact?.phone || ''} readOnly /></Field>
              <Field label="Email"><input value={activeContact?.email || ''} readOnly /></Field>
              <Field label="Monday Item ID"><input value={activeContact?.mondayItemId || ''} readOnly /></Field>
              <Field label="Notes loaded"><input value={`${notes.length} notes / updates / subitems`} readOnly /></Field>
            </div>
          </aside>
        </div>
      )}

      {view === 'notes' && (
        <div className="crm-record-layout">
          <div className="crm-table-card">
            <div className="crm-table-title"><h3>Contact Notes / Updates / Subitems</h3><span>{notes.length} shown</span></div>
            <div className="customer-table professional-table" role="table" aria-label="Contact notes">
              <div className="customer-table-row customer-table-head" role="row">
                <span>Type</span><span>Note</span><span>Author</span><span>Source</span><span>Created</span><span></span><span></span>
              </div>
              {notes.length === 0 && <div className="customer-table-row"><span>No notes loaded for this contact yet.</span><span></span><span></span><span></span><span></span><span></span><span></span></div>}
              {notes.map((note) => (
                <div className="customer-table-row" role="row" key={note.id}>
                  <Badge tone="dark">{note.noteType}</Badge><span>{note.body}</span><span>{note.authorName || '-'}</span><span>{note.source}</span><span>{note.createdAt ? new Date(note.createdAt).toLocaleString() : '-'}</span><span></span><span></span>
                </div>
              ))}
            </div>
          </div>
          <aside className="crm-record-panel" aria-label="Selected contact for notes"><div className="record-panel-header"><Badge>Notes</Badge><h3>{activeContact ? contactName(activeContact) : 'No contact selected'}</h3><p>Select a contact, then open Contact Notes to see Monday comments, updates, and subitems pulled into the CRM.</p></div></aside>
        </div>
      )}
    </section>
  );
}
