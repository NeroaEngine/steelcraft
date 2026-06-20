(function () {
  const PATH = '/portal/hr';
  const KEY = 'steelcraft_hr_portal_live_v4';
  const steps = ['Profile', 'Documents', 'Training', 'Payroll', 'Ready'];
  const emptyEmployee = { name: '', role: '', department: '', startDate: '', status: 'Onboarding', email: '', phone: '' };
  const emptyTraining = { title: '', owner: '', dueDate: '', audience: 'All employees', status: 'Draft' };
  const emptyPolicy = { title: '', category: '', owner: '', status: 'Draft', summary: '' };
  const seed = {
    tab: 'employees',
    draftEmployee: { ...emptyEmployee },
    draftTraining: { ...emptyTraining },
    draftPolicy: { ...emptyPolicy },
    employees: [
      { id: 'emp-colton', name: 'Colton Cameron', role: 'Head Project Manager / Estimator', department: 'Project Management', startDate: '', status: 'Active', email: 'colton@mariondevelopmentgroup.com', phone: '13523611818', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, training: {}, policies: { 'Employee Handbook': true } },
      { id: 'emp-seth', name: 'Seth McBride', role: 'President', department: 'Development', startDate: '2022-01-01', status: 'Active', email: 'seth@mariondevelopmentgroup.com', phone: '13522869466', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, training: {}, policies: { 'Employee Handbook': true } },
      { id: 'emp-bj', name: 'BJ Hammett', role: 'Partner', department: 'Sales', startDate: '2023-10-01', status: 'Active', email: '', phone: '', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, training: {}, policies: { 'Employee Handbook': true } },
      { id: 'emp-brad', name: 'Brad Hammett', role: 'Partner', department: 'Development', startDate: '2023-10-01', status: 'Active', email: 'brad@mariondevelopmentgroup.com', phone: '13524278803', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, training: {}, policies: { 'Employee Handbook': true } }
    ],
    training: [
      { id: 'tr-safety', title: 'Safety Orientation', owner: 'HR / Safety', dueDate: '2026-07-01', audience: 'All employees', status: 'Active' },
      { id: 'tr-fall', title: 'Fall Protection', owner: 'Safety', dueDate: '2026-07-15', audience: 'Field employees', status: 'Active' },
      { id: 'tr-erp', title: 'Neroa ERP Basics', owner: 'Admin', dueDate: '2026-07-10', audience: 'Office employees', status: 'Draft' }
    ],
    policies: [
      { id: 'pol-handbook', title: 'Employee Handbook', category: 'General HR', owner: 'HR', status: 'Published', summary: 'Company standards, attendance, conduct, and employee acknowledgements.' },
      { id: 'pol-ppe', title: 'PPE Policy', category: 'Safety', owner: 'Safety', status: 'Published', summary: 'Required PPE, jobsite safety rules, and acknowledgement tracking.' },
      { id: 'pol-timecard', title: 'Timecard Policy', category: 'Payroll', owner: 'Accounting', status: 'Draft', summary: 'Clock-in, approval, corrections, and payroll cutoff.' }
    ]
  };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function load() { try { return { ...clone(seed), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return clone(seed); } }
  function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }
  function esc(v) { return String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function pct(employee) { return Math.round((steps.filter((step) => employee.onboarding && employee.onboarding[step]).length / steps.length) * 100); }
  function setStage(employee, stage) {
    employee.onboarding = employee.onboarding || {};
    const index = steps.indexOf(stage);
    steps.forEach((step, stepIndex) => { employee.onboarding[step] = stepIndex <= index; });
    employee.status = stage === 'Ready' ? 'Active' : 'Onboarding';
  }
  function employeeStage(employee) {
    let last = 'Profile';
    steps.forEach((step) => { if (employee.onboarding && employee.onboarding[step]) last = step; });
    return employee.status === 'Active' && employee.onboarding && employee.onboarding.Ready ? 'Ready' : last;
  }
  function style() {
    if (document.getElementById('hr-v4-style')) return;
    const node = document.createElement('style');
    node.id = 'hr-v4-style';
    node.textContent = `
      .hr-live{width:calc(100vw - 44px);display:grid;gap:18px}.hr-headline{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start}.hr-headline h1{margin:4px 0;font-size:clamp(34px,5vw,56px)}.hr-tabs,.hr-actions{display:flex;gap:10px;flex-wrap:wrap}.hr-tabs button,.hr-btn{border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.06);color:var(--text);padding:9px 13px;font-weight:900;cursor:pointer}.hr-tabs button.active,.hr-btn.primary{border:0;background:var(--brand-accent);color:#fff}.hr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.hr-stat,.hr-panel,.hr-stage{border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.035);padding:14px}.hr-stat strong{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.hr-stat b{display:block;color:var(--text);font-size:30px;margin-top:4px}.hr-form{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;align-items:end}.hr-form label,.hr-cell label{display:grid;gap:5px;color:var(--muted);font-size:12px;font-weight:900}.hr-form input,.hr-form select,.hr-table input,.hr-table select{width:100%;min-height:40px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(0,0,0,.22);color:var(--text);padding:8px 10px;font-weight:800;box-sizing:border-box}.hr-table{display:grid;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.025);overflow-x:auto}.hr-row{min-width:1220px;display:grid;grid-template-columns:1fr .85fr .85fr .75fr .75fr 1fr .7fr;border-bottom:1px solid var(--line)}.hr-row.training{grid-template-columns:1.25fr .8fr .8fr 1fr .7fr .7fr}.hr-row.policy{grid-template-columns:1.2fr .75fr .75fr .7fr 1.4fr .7fr}.hr-row.head{background:rgba(0,0,0,.22);color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-size:12px;font-weight:950}.hr-cell{min-height:56px;padding:10px 12px;border-right:1px solid var(--line);display:grid;align-items:center}.hr-pill{display:inline-flex;width:fit-content;border-radius:999px;padding:5px 9px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--muted);font-size:12px;font-weight:900}.hr-board{display:grid;grid-template-columns:repeat(5,minmax(185px,1fr));gap:12px}.hr-stage{min-height:380px;display:grid;gap:10px;align-content:start}.hr-stage.drag-over{outline:2px solid var(--brand-accent);background:rgba(159,61,66,.16)}.hr-stage h3{margin:0;display:flex;justify-content:space-between;gap:8px;align-items:center}.hr-card{border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(0,0,0,.22);padding:11px;display:grid;gap:7px;cursor:grab}.hr-card:active{cursor:grabbing}.hr-card small{color:var(--muted)}.hr-card .hr-actions button{padding:6px 9px}.hr-drop-note{color:var(--muted);font-size:12px;margin:0}.hr-muted{color:var(--muted)}@media(max-width:1100px){.hr-stats,.hr-board{grid-template-columns:1fr 1fr}.hr-form{grid-template-columns:1fr 1fr}}@media(max-width:720px){.hr-stats,.hr-board,.hr-form{grid-template-columns:1fr}}
    `;
    document.head.appendChild(node);
  }
  function metrics(state) {
    return {
      active: state.employees.filter((e) => e.status === 'Active').length,
      onboarding: state.employees.filter((e) => !e.onboarding || !e.onboarding.Ready).length,
      training: state.training.filter((t) => t.status !== 'Archived').length,
      policies: state.policies.filter((p) => p.status === 'Published').length
    };
  }
  function form(state, name, fields, action, title) {
    const draft = state[name];
    return `<section class="hr-panel"><h2>${title}</h2><div class="hr-form">${fields.map((field) => `<label>${field.label}${field.type === 'select' ? `<select data-draft="${name}.${field.key}">${field.options.map((option) => `<option${draft[field.key] === option ? ' selected' : ''}>${option}</option>`).join('')}</select>` : `<input ${field.type ? `type="${field.type}"` : ''} data-draft="${name}.${field.key}" value="${esc(draft[field.key])}" />`}</label>`).join('')}<button class="hr-btn primary" data-action="${action}">Create</button></div></section>`;
  }
  function renderEmployees(state) {
    return `${form(state, 'draftEmployee', [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'department', label: 'Department' }, { key: 'startDate', label: 'Start date', type: 'date' }, { key: 'status', label: 'Status', type: 'select', options: ['Onboarding', 'Active', 'Inactive'] }, { key: 'email', label: 'Email' }], 'add-employee', 'Create employee')}<section class="hr-table"><div class="hr-row head"><div class="hr-cell">Employee</div><div class="hr-cell">Role</div><div class="hr-cell">Department</div><div class="hr-cell">Start</div><div class="hr-cell">Status</div><div class="hr-cell">Email / Phone</div><div class="hr-cell">Progress</div></div>${state.employees.map((e) => `<div class="hr-row"><div class="hr-cell"><strong>${esc(e.name)}</strong></div><div class="hr-cell"><input data-emp="${e.id}" data-prop="role" value="${esc(e.role)}" /></div><div class="hr-cell"><input data-emp="${e.id}" data-prop="department" value="${esc(e.department)}" /></div><div class="hr-cell"><input type="date" data-emp="${e.id}" data-prop="startDate" value="${esc(e.startDate)}" /></div><div class="hr-cell"><select data-emp="${e.id}" data-prop="status"><option${e.status === 'Onboarding' ? ' selected' : ''}>Onboarding</option><option${e.status === 'Active' ? ' selected' : ''}>Active</option><option${e.status === 'Inactive' ? ' selected' : ''}>Inactive</option></select></div><div class="hr-cell"><small>${esc(e.email || '')}<br/>${esc(e.phone || '')}</small></div><div class="hr-cell"><span class="hr-pill">${pct(e)}%</span></div></div>`).join('')}</section>`;
  }
  function renderOnboarding(state) {
    return `<div class="hr-board">${steps.map((step) => {
      const cards = state.employees.filter((employee) => employeeStage(employee) === step);
      return `<section class="hr-stage" data-stage="${esc(step)}"><h3>${esc(step)} <span class="hr-pill">${cards.length}</span></h3><p class="hr-drop-note">Drop employee cards here.</p>${cards.map((employee) => `<article class="hr-card" draggable="true" data-emp-card="${employee.id}"><strong>${esc(employee.name)}</strong><small>${esc(employee.role)} · ${esc(employee.department)}</small><span class="hr-pill">${pct(employee)}% complete</span><div class="hr-actions"><button class="hr-btn" data-action="move-prev" data-emp="${employee.id}">Back</button><button class="hr-btn primary" data-action="move-next" data-emp="${employee.id}">Next</button></div></article>`).join('')}</section>`;
    }).join('')}</div>`;
  }
  function renderTraining(state) {
    return `${form(state, 'draftTraining', [{ key: 'title', label: 'Training' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due date', type: 'date' }, { key: 'audience', label: 'Audience' }, { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Archived'] }], 'add-training', 'Create training')}<section class="hr-table"><div class="hr-row training head"><div class="hr-cell">Training</div><div class="hr-cell">Owner</div><div class="hr-cell">Due</div><div class="hr-cell">Audience</div><div class="hr-cell">Status</div><div class="hr-cell">Action</div></div>${state.training.map((t) => `<div class="hr-row training"><div class="hr-cell"><strong>${esc(t.title)}</strong></div><div class="hr-cell"><input data-train="${t.id}" data-prop="owner" value="${esc(t.owner)}" /></div><div class="hr-cell"><input type="date" data-train="${t.id}" data-prop="dueDate" value="${esc(t.dueDate)}" /></div><div class="hr-cell"><input data-train="${t.id}" data-prop="audience" value="${esc(t.audience)}" /></div><div class="hr-cell"><select data-train="${t.id}" data-prop="status"><option${t.status === 'Draft' ? ' selected' : ''}>Draft</option><option${t.status === 'Active' ? ' selected' : ''}>Active</option><option${t.status === 'Archived' ? ' selected' : ''}>Archived</option></select></div><div class="hr-cell"><button class="hr-btn" data-action="assign-training" data-train="${t.id}">Assign</button></div></div>`).join('')}</section>`;
  }
  function renderPolicies(state) {
    return `${form(state, 'draftPolicy', [{ key: 'title', label: 'Policy' }, { key: 'category', label: 'Category' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Published', 'Archived'] }, { key: 'summary', label: 'Summary' }], 'add-policy', 'Create policy')}<section class="hr-table"><div class="hr-row policy head"><div class="hr-cell">Policy</div><div class="hr-cell">Category</div><div class="hr-cell">Owner</div><div class="hr-cell">Status</div><div class="hr-cell">Summary</div><div class="hr-cell">Ack</div></div>${state.policies.map((p) => `<div class="hr-row policy"><div class="hr-cell"><strong>${esc(p.title)}</strong></div><div class="hr-cell"><input data-policy="${p.id}" data-prop="category" value="${esc(p.category)}" /></div><div class="hr-cell"><input data-policy="${p.id}" data-prop="owner" value="${esc(p.owner)}" /></div><div class="hr-cell"><select data-policy="${p.id}" data-prop="status"><option${p.status === 'Draft' ? ' selected' : ''}>Draft</option><option${p.status === 'Published' ? ' selected' : ''}>Published</option><option${p.status === 'Archived' ? ' selected' : ''}>Archived</option></select></div><div class="hr-cell"><input data-policy="${p.id}" data-prop="summary" value="${esc(p.summary)}" /></div><div class="hr-cell"><span class="hr-pill">${state.employees.filter((e) => e.policies && e.policies[p.title]).length}/${state.employees.length}</span></div></div>`).join('')}</section>`;
  }
  function body(state) { if (state.tab === 'onboarding') return renderOnboarding(state); if (state.tab === 'training') return renderTraining(state); if (state.tab === 'policies') return renderPolicies(state); return renderEmployees(state); }
  function render(root, state) {
    const m = metrics(state);
    root.dataset.hrLive = 'v4';
    root.innerHTML = `<section class="hr-live"><header class="workspace-header panel hr-headline"><div><p class="eyebrow">Canonical live module</p><h1>HR Portal</h1><p>Active HR system: employees, movable onboarding cards, training assignments, and policies.</p></div><div class="live-badge">HR live board</div></header><div class="hr-stats"><div class="hr-stat"><strong>Active employees</strong><b>${m.active}</b><span>${state.employees.length} total</span></div><div class="hr-stat"><strong>Onboarding open</strong><b>${m.onboarding}</b><span>not ready yet</span></div><div class="hr-stat"><strong>Training modules</strong><b>${m.training}</b><span>active or draft</span></div><div class="hr-stat"><strong>Published policies</strong><b>${m.policies}</b><span>ready for acknowledgement</span></div></div><nav class="hr-tabs"><button data-tab="employees" class="${state.tab === 'employees' ? 'active' : ''}">Employees</button><button data-tab="onboarding" class="${state.tab === 'onboarding' ? 'active' : ''}">Onboarding Board</button><button data-tab="training" class="${state.tab === 'training' ? 'active' : ''}">Training</button><button data-tab="policies" class="${state.tab === 'policies' ? 'active' : ''}">Policies</button></nav>${body(state)}</section>`;
    bind(root, state);
  }
  function bind(root, state) {
    root.onclick = (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) { state.tab = tab.dataset.tab; save(state); render(root, state); return; }
      const action = event.target.closest('[data-action]');
      if (!action) return;
      const a = action.dataset.action;
      if (a === 'add-employee') { const draft = state.draftEmployee; if (!draft.name.trim()) return; const employee = { ...draft, id: uid('emp'), onboarding: {}, training: {}, policies: {} }; steps.forEach((step) => { employee.onboarding[step] = false; }); state.employees.unshift(employee); state.draftEmployee = { ...emptyEmployee }; }
      if (a === 'add-training') { const draft = state.draftTraining; if (!draft.title.trim()) return; state.training.unshift({ ...draft, id: uid('tr') }); state.draftTraining = { ...emptyTraining }; }
      if (a === 'add-policy') { const draft = state.draftPolicy; if (!draft.title.trim()) return; state.policies.unshift({ ...draft, id: uid('pol') }); state.draftPolicy = { ...emptyPolicy }; }
      if (a === 'assign-training') { const training = state.training.find((t) => t.id === action.dataset.train); if (training) state.employees.forEach((employee) => { employee.training = employee.training || {}; employee.training[training.title] = employee.training[training.title] || 'Assigned'; }); }
      if (a === 'move-next' || a === 'move-prev') { const employee = state.employees.find((e) => e.id === action.dataset.emp); if (employee) { const current = steps.indexOf(employeeStage(employee)); const next = a === 'move-next' ? Math.min(current + 1, steps.length - 1) : Math.max(current - 1, 0); setStage(employee, steps[next]); } }
      save(state); render(root, state);
    };
    root.ondragstart = (event) => { const card = event.target.closest('[data-emp-card]'); if (!card) return; event.dataTransfer.setData('text/plain', card.dataset.empCard); event.dataTransfer.effectAllowed = 'move'; };
    root.ondragover = (event) => { const stage = event.target.closest('[data-stage]'); if (!stage) return; event.preventDefault(); stage.classList.add('drag-over'); };
    root.ondragleave = (event) => { const stage = event.target.closest('[data-stage]'); if (stage) stage.classList.remove('drag-over'); };
    root.ondrop = (event) => { const stage = event.target.closest('[data-stage]'); if (!stage) return; event.preventDefault(); stage.classList.remove('drag-over'); const employeeId = event.dataTransfer.getData('text/plain'); const employee = state.employees.find((e) => e.id === employeeId); if (employee) { setStage(employee, stage.dataset.stage); save(state); render(root, state); } };
    root.oninput = root.onchange = (event) => {
      const el = event.target;
      const draft = el.dataset.draft;
      if (draft) { const [group, prop] = draft.split('.'); state[group][prop] = el.value; save(state); return; }
      if (el.dataset.emp) { const row = state.employees.find((e) => e.id === el.dataset.emp); if (row) row[el.dataset.prop] = el.value; save(state); return; }
      if (el.dataset.train) { const row = state.training.find((t) => t.id === el.dataset.train); if (row) row[el.dataset.prop] = el.value; save(state); return; }
      if (el.dataset.policy) { const row = state.policies.find((p) => p.id === el.dataset.policy); if (row) row[el.dataset.prop] = el.value; save(state); }
    };
  }
  function boot() {
    if (location.pathname.replace(/\/$/, '') !== PATH) return;
    style();
    const workspace = document.querySelector('.workspace');
    if (!workspace) return setTimeout(boot, 80);
    if (workspace.dataset.hrLive === 'v4') return;
    render(workspace, load());
  }
  window.addEventListener('popstate', () => setTimeout(boot, 60));
  new MutationObserver(() => setTimeout(boot, 80)).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(boot, 80);
  setTimeout(boot, 700);
})();
