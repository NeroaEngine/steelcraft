(function () {
  var KEY = 'steelcraft_sales_pipeline_v1';
  var STAGES = ['Lead', 'Qualified', 'Estimating', 'Proposal Sent', 'Follow Up', 'Negotiation', 'Awarded', 'Contract Executed'];
  var AUTOMATIONS = ['7 day follow-up', '15 day follow-up', '30 day follow-up', '60 day follow-up', '90 day follow-up'];
  var EMAIL_TEMPLATES = [
    { name: 'Initial Lead Response', use: 'Send after a new lead is entered.' },
    { name: 'Bid Due Reminder', use: 'Send before bid due date.' },
    { name: 'Proposal Sent Follow-Up', use: 'Send after proposal delivery.' },
    { name: 'Negotiation Check-In', use: 'Send while awaiting decision.' },
    { name: 'Award / Contract Next Steps', use: 'Send after award before contract execution.' }
  ];

  function readRows() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeRows(rows) {
    localStorage.setItem(KEY, JSON.stringify(rows));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtMoney(value) {
    var n = Number(value || 0);
    if (!Number.isFinite(n) || !n) return '';
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function nextFollowUpLabel(stage) {
    if (stage === 'Contract Executed' || stage === 'Awarded') return 'Closed follow-up';
    if (stage === 'Proposal Sent') return '7 day follow-up';
    if (stage === 'Follow Up') return '15 day follow-up';
    if (stage === 'Negotiation') return '30 day follow-up';
    return '7 day follow-up';
  }

  function stageOptions(current) {
    return STAGES.map(function (stage) {
      return '<option value="' + escapeHtml(stage) + '"' + (stage === current ? ' selected' : '') + '>' + escapeHtml(stage) + '</option>';
    }).join('');
  }

  function seedRows() {
    var rows = [
      { id: 'crm-sales-sample-1', project: 'New sales lead', stage: 'Lead', quoteStatus: 'New', customer: '', generalContractor: '', architect: '', bidDueDate: '', estimator: '', salesperson: '', leadSource: '', proposalHistory: '', emailCommunications: '', value: '' }
    ];
    writeRows(rows);
    return rows;
  }

  function summarize(rows) {
    return STAGES.map(function (stage) {
      return { stage: stage, count: rows.filter(function (row) { return (row.stage || 'Lead') === stage; }).length };
    });
  }

  function rowHtml(row, index) {
    var stage = row.stage || 'Lead';
    return '' +
      '<tr data-index="' + index + '">' +
      '<td><strong>' + escapeHtml(row.project || row.name || 'Untitled lead') + '</strong><small>' + escapeHtml(row.location || row.projectInfo || '') + '</small></td>' +
      '<td><select data-sales-stage="' + index + '">' + stageOptions(stage) + '</select></td>' +
      '<td>' + escapeHtml(row.customer || '') + '<small>' + escapeHtml(row.generalContractor || '') + '</small></td>' +
      '<td>' + escapeHtml(row.architect || '') + '</td>' +
      '<td>' + escapeHtml(row.bidDueDate || '') + '</td>' +
      '<td>' + escapeHtml(row.quoteStatus || stage) + '<small>' + escapeHtml(nextFollowUpLabel(stage)) + '</small></td>' +
      '<td>' + escapeHtml(row.estimator || '') + '<small>' + escapeHtml(row.salesperson || '') + '</small></td>' +
      '<td>' + fmtMoney(row.value) + '</td>' +
      '</tr>';
  }

  function mount() {
    if (!/^\/portal\/sales\/?$/.test(location.pathname || '')) return;
    var workspace = document.querySelector('.workspace');
    if (!workspace || workspace.getAttribute('data-crm-sales-mounted') === 'true') return;
    workspace.setAttribute('data-crm-sales-mounted', 'true');

    var rows = readRows();
    if (!rows.length) rows = seedRows();
    var state = { query: '', stage: 'All', rows: rows };

    function filteredRows() {
      var q = state.query.trim().toLowerCase();
      return state.rows.filter(function (row) {
        var stageOk = state.stage === 'All' || (row.stage || 'Lead') === state.stage;
        var searchOk = !q || Object.keys(row).some(function (key) { return String(row[key] || '').toLowerCase().indexOf(q) >= 0; });
        return stageOk && searchOk;
      });
    }

    function render() {
      var rowsToShow = filteredRows();
      var summary = summarize(state.rows);
      workspace.innerHTML = '' +
        '<style>' +
        '.crm-sales-master{display:grid;gap:18px;width:calc(100vw - 44px);max-width:none}.crm-sales-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.crm-sales-card{border:1px solid var(--line);border-radius:18px;background:var(--card);padding:16px;box-shadow:0 18px 48px rgba(0,0,0,.18)}.crm-sales-card h3{margin:0 0 8px}.crm-sales-card p,.crm-sales-card small{color:var(--muted)}.crm-sales-stage-strip{display:grid;grid-template-columns:repeat(8,minmax(120px,1fr));gap:8px;overflow-x:auto}.crm-sales-stage{border:1px solid var(--line);border-radius:14px;padding:12px;background:rgba(255,255,255,.04)}.crm-sales-stage strong{display:block}.crm-sales-toolbar{display:grid;grid-template-columns:minmax(260px,1fr) 240px auto;gap:10px;align-items:end}.crm-sales-toolbar input,.crm-sales-toolbar select,.crm-sales-table select{min-height:40px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:var(--input);color:var(--text);font-weight:800;padding:8px 10px}.crm-sales-toolbar a,.crm-sales-master button{border:0;border-radius:999px;background:var(--button);color:var(--button-text);font-weight:950;padding:11px 16px;text-decoration:none;display:inline-flex;justify-content:center;align-items:center}.crm-sales-table-wrap{overflow:auto;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.02)}.crm-sales-table{width:100%;min-width:1320px;border-collapse:collapse}.crm-sales-table th,.crm-sales-table td{border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}.crm-sales-table th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;background:rgba(0,0,0,.22)}.crm-sales-table td strong,.crm-sales-table td small{display:block}.crm-sales-list{display:grid;gap:8px}.crm-sales-list div{border:1px solid var(--line);border-radius:12px;padding:10px;background:rgba(255,255,255,.035)}@media(max-width:900px){.crm-sales-grid,.crm-sales-toolbar{grid-template-columns:1fr}}' +
        '</style>' +
        '<section class="crm-sales-master">' +
        '<header class="workspace-header panel"><div><p class="eyebrow">Master Module 1</p><h1>CRM &amp; Sales</h1><p>Manage leads through contract award. Tracks lead source, customer, GC, architect, bid due date, quote status, follow-up, estimator, salesperson, proposal history, and email communication.</p></div><div class="live-badge">Lead → Contract</div></header>' +
        '<div class="crm-sales-stage-strip">' + summary.map(function (item) { return '<div class="crm-sales-stage"><strong>' + escapeHtml(item.count) + '</strong><small>' + escapeHtml(item.stage) + '</small></div>'; }).join('') + '</div>' +
        '<div class="crm-sales-grid"><article class="crm-sales-card"><h3>Pipeline stages</h3><p>Lead → Qualified → Estimating → Proposal Sent → Follow Up → Negotiation → Awarded → Contract Executed</p></article><article class="crm-sales-card"><h3>Automations</h3><p>' + AUTOMATIONS.map(escapeHtml).join(' · ') + '</p></article><article class="crm-sales-card"><h3>Email templates</h3><p>Pre-built templates are staged for lead response, bid reminders, proposal follow-up, negotiation, and contract next steps.</p></article><article class="crm-sales-card"><h3>Imported records</h3><p><strong>' + state.rows.length + '</strong> sales / estimating leads loaded.</p></article></div>' +
        '<div class="crm-sales-toolbar"><label><span>Search</span><input data-sales-query value="' + escapeHtml(state.query) + '" placeholder="Search lead, customer, estimator, email..." /></label><label><span>Stage filter</span><select data-sales-filter><option value="All">All stages</option>' + STAGES.map(function (stage) { return '<option value="' + escapeHtml(stage) + '"' + (stage === state.stage ? ' selected' : '') + '>' + escapeHtml(stage) + '</option>'; }).join('') + '</select></label><a href="/steelcraft-sales-import.html">Import Sales Spreadsheet</a></div>' +
        '<div class="crm-sales-table-wrap"><table class="crm-sales-table"><thead><tr><th>Lead / Project</th><th>Stage</th><th>Customer / GC</th><th>Architect</th><th>Bid Due</th><th>Quote / Follow-Up</th><th>Estimator / Salesperson</th><th>Value</th></tr></thead><tbody>' + (rowsToShow.length ? rowsToShow.slice(0, 100).map(rowHtml).join('') : '<tr><td colspan="8">No rows match this filter.</td></tr>') + '</tbody></table></div>' +
        '<div class="crm-sales-grid"><article class="crm-sales-card"><h3>Follow-up automations</h3><div class="crm-sales-list">' + AUTOMATIONS.map(function (name) { return '<div><strong>' + escapeHtml(name) + '</strong><small>Queued from proposal/follow-up stage dates.</small></div>'; }).join('') + '</div></article><article class="crm-sales-card"><h3>Email templates</h3><div class="crm-sales-list">' + EMAIL_TEMPLATES.map(function (t) { return '<div><strong>' + escapeHtml(t.name) + '</strong><small>' + escapeHtml(t.use) + '</small></div>'; }).join('') + '</div></article><article class="crm-sales-card"><h3>Proposal history</h3><p>Proposal history and email communication are retained per imported lead row and can be moved into database-backed history during the OAuth/data migration pass.</p></article><article class="crm-sales-card"><h3>Next handoff</h3><p>Awarded leads move to Projects after contract execution.</p></article></div>' +
        '</section>';

      var query = workspace.querySelector('[data-sales-query]');
      var filter = workspace.querySelector('[data-sales-filter]');
      if (query) query.addEventListener('input', function (event) { state.query = event.target.value; render(); });
      if (filter) filter.addEventListener('change', function (event) { state.stage = event.target.value; render(); });
      workspace.querySelectorAll('[data-sales-stage]').forEach(function (select) {
        select.addEventListener('change', function (event) {
          var index = Number(event.target.getAttribute('data-sales-stage'));
          var visible = filteredRows();
          var target = visible[index];
          var sourceIndex = state.rows.findIndex(function (row) { return row.id === target.id; });
          if (sourceIndex >= 0) {
            state.rows[sourceIndex] = Object.assign({}, state.rows[sourceIndex], { stage: event.target.value, quoteStatus: event.target.value });
            writeRows(state.rows);
            render();
          }
        });
      });
    }

    render();
  }

  function boot() {
    mount();
    var lastPath = location.pathname;
    setInterval(function () {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        document.querySelectorAll('[data-crm-sales-mounted="true"]').forEach(function (node) { node.removeAttribute('data-crm-sales-mounted'); });
      }
      mount();
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
