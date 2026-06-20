(function () {
  const PATH = '/portal/hr';
  const STORE = 'steelcraft_hr_policy_records_v1';
  let openId = '';
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const slug = (value) => String(value || 'policy').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'policy';
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } }
  function save(records) { localStorage.setItem(STORE, JSON.stringify(records)); }
  function policyRows() { return Array.from(document.querySelectorAll('.hr-live-v6 .hr-row.policy:not(.head), .hr-live-v5 .hr-row.policy:not(.head)')); }
  function rowInfo(row) {
    const field = row.querySelector('[data-policy]');
    const titleNode = row.querySelector('strong');
    const id = field?.dataset?.policy || slug(titleNode?.textContent || 'policy');
    return { id, title: (titleNode?.textContent || '').trim() || id, row };
  }
  function ensureStyle() {
    if (document.getElementById('hr-policy-records-style')) return;
    const style = document.createElement('style');
    style.id = 'hr-policy-records-style';
    style.textContent = `.hr-policy-open-btn{border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.06);color:var(--text);padding:5px 8px;font-size:10px;font-weight:900;cursor:pointer;margin-top:5px}.hr-policy-open-btn.primary{border:0;background:var(--brand-accent);color:#fff}.hr-policy-detail-panel{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.04);padding:12px;display:grid;gap:10px}.hr-policy-detail-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}.hr-policy-detail-head h2{margin:0;font-size:18px}.hr-policy-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.hr-policy-detail-grid label{display:grid;gap:4px;color:var(--muted);font-size:10px;font-weight:900}.hr-policy-detail-grid input,.hr-policy-detail-grid textarea,.hr-policy-detail-grid select{width:100%;min-height:32px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:rgba(0,0,0,.22);color:var(--text);padding:6px 8px;font-size:11px;font-weight:800;box-sizing:border-box}.hr-policy-detail-grid textarea{min-height:100px;resize:vertical}.hr-policy-wide{grid-column:1/-1}.hr-policy-status{border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.04);padding:8px 10px;font-size:11px}.hr-policy-actions{display:flex;gap:7px;flex-wrap:wrap}@media(max-width:900px){.hr-policy-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.hr-policy-detail-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }
  function baseRecord(id, title) {
    return { id, title, category: '', owner: '', status: 'Draft', summary: '', body: '', vaultId: '', vaultUrl: '', vaultLinkedAt: '' };
  }
  function getRecord(id, title) {
    const records = load();
    return { ...baseRecord(id, title), ...(records[id] || {}) };
  }
  function setRecord(record) {
    const records = load();
    records[record.id] = record;
    save(records);
  }
  function insertControls() {
    policyRows().forEach((row) => {
      if (row.dataset.policyEnhanced === 'true') return;
      const info = rowInfo(row);
      const record = getRecord(info.id, info.title);
      const firstCell = row.querySelector('.hr-cell');
      if (!firstCell) return;
      const actions = document.createElement('div');
      actions.className = 'hr-policy-actions';
      actions.innerHTML = `<button type="button" class="hr-policy-open-btn primary" data-hr-open-policy="${esc(info.id)}">Open Policy</button><button type="button" class="hr-policy-open-btn" data-hr-link-vault="${esc(info.id)}">${record.vaultId ? 'Vault Linked' : 'Link Vault'}</button>`;
      firstCell.appendChild(actions);
      row.dataset.policyEnhanced = 'true';
    });
  }
  function findTitle(id) {
    const row = policyRows().find((item) => rowInfo(item).id === id);
    return row ? rowInfo(row).title : id;
  }
  function detailHtml(record) {
    return `<section class="hr-policy-detail-panel" data-hr-policy-detail="${esc(record.id)}"><div class="hr-policy-detail-head"><div><p class="eyebrow">Policy record</p><h2>${esc(record.title)}</h2><small>${record.vaultId ? `Linked to ${esc(record.vaultId)}` : 'No vault record linked yet.'}</small></div><div class="hr-policy-actions"><button type="button" class="hr-policy-open-btn primary" data-hr-save-policy="${esc(record.id)}">Save Policy</button><button type="button" class="hr-policy-open-btn" data-hr-link-vault="${esc(record.id)}">${record.vaultId ? 'Relink Vault' : 'Link Vault'}</button>${record.vaultUrl ? `<button type="button" class="hr-policy-open-btn" data-hr-open-vault="${esc(record.id)}">Open Vault</button>` : ''}<button type="button" class="hr-policy-open-btn" data-hr-close-policy="true">Close</button></div></div><div class="hr-policy-status">Click into this policy, edit it here, then save it. Use Link Vault to attach a vault record.</div><div class="hr-policy-detail-grid"><label>Title<input data-hr-policy-field="title" value="${esc(record.title)}"></label><label>Category<input data-hr-policy-field="category" value="${esc(record.category)}"></label><label>Owner<input data-hr-policy-field="owner" value="${esc(record.owner)}"></label><label>Status<select data-hr-policy-field="status"><option${record.status === 'Draft' ? ' selected' : ''}>Draft</option><option${record.status === 'Published' ? ' selected' : ''}>Published</option><option${record.status === 'Archived' ? ' selected' : ''}>Archived</option></select></label><label class="hr-policy-wide">Summary<input data-hr-policy-field="summary" value="${esc(record.summary)}"></label><label class="hr-policy-wide">Policy Body<textarea data-hr-policy-field="body">${esc(record.body)}</textarea></label><label>Vault ID<input data-hr-policy-field="vaultId" value="${esc(record.vaultId)}" placeholder="Created when linked"></label><label class="hr-policy-wide">Vault URL<input data-hr-policy-field="vaultUrl" value="${esc(record.vaultUrl)}" placeholder="/portal/neroa-vault/hr-policy/..."></label></div></section>`;
  }
  function showDetail(id) {
    openId = id;
    const title = findTitle(id);
    const record = getRecord(id, title);
    const table = document.querySelector('.hr-live-v6 .hr-table, .hr-live-v5 .hr-table');
    if (!table) return;
    const existing = document.querySelector('[data-hr-policy-detail]');
    if (existing) existing.remove();
    table.insertAdjacentHTML('beforebegin', detailHtml(record));
  }
  function readDetail(id) {
    const panel = document.querySelector(`[data-hr-policy-detail="${CSS.escape(id)}"]`);
    const record = getRecord(id, findTitle(id));
    if (!panel) return record;
    panel.querySelectorAll('[data-hr-policy-field]').forEach((field) => { record[field.dataset.hrPolicyField] = field.value; });
    record.id = id;
    return record;
  }
  function linkVault(id) {
    const record = readDetail(id);
    record.vaultId = record.vaultId || `vault-hr-policy-${uid(slug(record.title))}`;
    record.vaultUrl = record.vaultUrl || `/portal/neroa-vault/hr-policy/${slug(record.title)}`;
    record.vaultLinkedAt = new Date().toISOString();
    setRecord(record);
    openId = id;
    enhance();
    showDetail(id);
  }
  function enhance() {
    if (location.pathname.replace(/\/$/, '') !== PATH) return;
    ensureStyle();
    insertControls();
    if (openId && policyRows().length) showDetail(openId);
  }
  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-hr-open-policy]');
    const link = event.target.closest('[data-hr-link-vault]');
    const saveButton = event.target.closest('[data-hr-save-policy]');
    const openVault = event.target.closest('[data-hr-open-vault]');
    const close = event.target.closest('[data-hr-close-policy]');
    if (!open && !link && !saveButton && !openVault && !close) return;
    event.preventDefault();
    event.stopPropagation();
    if (open) showDetail(open.dataset.hrOpenPolicy);
    if (link) linkVault(link.dataset.hrLinkVault);
    if (saveButton) { const record = readDetail(saveButton.dataset.hrSavePolicy); setRecord(record); showDetail(record.id); }
    if (openVault) { const record = readDetail(openVault.dataset.hrOpenVault); setRecord(record); if (record.vaultUrl) window.open(record.vaultUrl, '_blank'); }
    if (close) { openId = ''; document.querySelector('[data-hr-policy-detail]')?.remove(); }
    setTimeout(enhance, 40);
  }, true);
  window.addEventListener('popstate', () => setTimeout(enhance, 100));
  new MutationObserver(() => setTimeout(enhance, 80)).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(enhance, 200);
  setTimeout(enhance, 900);
})();
