import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const importTypes = [
  { id: 'contacts', title: 'Contacts', target: 'crm_contacts + crm_accounts' },
  { id: 'accounts', title: 'Accounts', target: 'crm_accounts' },
  { id: 'project-delivery', title: 'Project Delivery', target: 'project_delivery' },
  { id: 'erection-schedule', title: 'Erection Schedule', target: 'erection_schedule' },
];

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function SimpleDataImport() {
  const [kind, setKind] = useState('contacts');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [status, setStatus] = useState('Choose a spreadsheet and import.');
  const [receipt, setReceipt] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const selectedType = useMemo(() => importTypes.find((type) => type.id === kind), [kind]);
  const previewRows = rows.slice(0, 10);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setReceipt(null);
    setStatus('Reading spreadsheet...');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const nextColumns = Array.from(new Set(jsonRows.flatMap((row) => Object.keys(row))));
      setRows(jsonRows);
      setColumns(nextColumns);
      setStatus(`Loaded ${jsonRows.length} rows from ${firstSheetName}.`);
    } catch (error) {
      setRows([]);
      setColumns([]);
      setStatus(`File read failed: ${error.message}`);
    }
  }

  async function importRows() {
    if (!rows.length) {
      setStatus('No rows loaded. Choose a spreadsheet first.');
      return;
    }

    setIsImporting(true);
    setReceipt(null);
    setStatus(`Importing ${rows.length} rows into ${selectedType?.target || kind}...`);

    try {
      const response = await fetch(`/api/data-import/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, rows }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Import failed');
      setReceipt(payload);
      setStatus(`Imported ${payload.imported ?? payload.rowsRead} rows. Skipped ${payload.skipped || 0}.`);
    } catch (error) {
      setStatus(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="workspace-shell">
      <section className="card">
        <div className="section-heading">
          <Badge tone="green">Data Import</Badge>
          <h1>Steel Craft Card Import</h1>
          <p>Simple spreadsheet importer for Contacts, Accounts, Project Delivery, and Erection Schedule. No Migration App. No Forge. Just upload and import.</p>
        </div>

        <div className="module-grid four-up">
          {importTypes.map((type) => (
            <button key={type.id} className={`portal-card workarea-card ${kind === type.id ? 'active' : ''}`} onClick={() => setKind(type.id)} type="button">
              <Badge>{type.target}</Badge>
              <h3>{type.title}</h3>
              <p>Import into {type.target}.</p>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="section-heading">
            <Badge>Upload</Badge>
            <h2>{selectedType?.title} Import</h2>
            <p>Upload .xlsx or .csv exported from Monday/spreadsheet data.</p>
          </div>
          <div className="employee-context">
            <label className="field"><span>Import Type</span><input value={selectedType?.title || kind} readOnly /></label>
            <label className="field"><span>Target</span><input value={selectedType?.target || ''} readOnly /></label>
            <label className="field"><span>Spreadsheet</span><input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} /></label>
            <label className="field"><span>Rows Loaded</span><input value={rows.length} readOnly /></label>
          </div>
          <button className="primary auth-button" type="button" disabled={isImporting || !rows.length} onClick={importRows}>{isImporting ? 'Importing...' : 'Import Rows'}</button>
          <p className="connection-status">{status}</p>
        </div>

        {columns.length > 0 && (
          <div className="card">
            <div className="section-heading">
              <Badge>Preview</Badge>
              <h2>Spreadsheet Preview</h2>
              <p>Showing the first 10 rows before import.</p>
            </div>
            <div className="customer-table professional-table" role="table">
              <div className="customer-table-row customer-table-head" role="row">
                {columns.slice(0, 7).map((column) => <span key={column}>{column}</span>)}
              </div>
              {previewRows.map((row, rowIndex) => (
                <div className="customer-table-row" role="row" key={rowIndex}>
                  {columns.slice(0, 7).map((column) => <span key={column}>{String(row[column] ?? '')}</span>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {receipt && (
          <div className="card">
            <div className="section-heading">
              <Badge tone="green">Receipt</Badge>
              <h2>Import Complete</h2>
              <p>{receipt.fileName}</p>
            </div>
            <div className="module-grid four-up">
              <article className="module"><Badge>Rows Read</Badge><h3>{receipt.rowsRead}</h3><p>Total source rows.</p></article>
              <article className="module"><Badge>Imported</Badge><h3>{receipt.imported ?? receipt.rowsRead}</h3><p>Rows written.</p></article>
              <article className="module"><Badge>Skipped</Badge><h3>{receipt.skipped || 0}</h3><p>Rows skipped.</p></article>
              <article className="module"><Badge>Errors</Badge><h3>{receipt.errors?.length || 0}</h3><p>Validation errors.</p></article>
            </div>
            {receipt.errors?.length > 0 && <pre className="placeholder-box">{receipt.errors.slice(0, 25).join('\n')}</pre>}
          </div>
        )}
      </section>
    </main>
  );
}
