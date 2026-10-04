(function () {
  const HR_PATH = '/portal/hr';
  const key = 'steelcraft_hr_portal_live_v1';
  const blankEmployee = { name: '', role: '', department: '', startDate: '', status: 'Onboarding' };
  const blankTraining = { title: '', owner: '', dueDate: '', audience: 'All employees', status: 'Draft' };
  const blankPolicy = { title: '', category: '', owner: '', status: 'Draft', summary: '' };
  const onboardingSteps = ['Profile', 'Documents', 'Safety training', 'Payroll', 'Ready'];
  const seed = {
    tab: 'employees',
    newEmployee: blankEmployee,
    newTraining: blankTraining,
    newPolicy: blankPolicy,
    employees: [
      { id: 'emp-001', name: 'Andy Wilkin', role: 'Project Manager', department: 'Operations', startDate: '2026-01-05', status: 'Active', onboarding: { Profile: true, Documents: true, 'Safety training': true, Payroll: true, Ready: true }, training: { 'Safety Orientation': 'Complete', 'Fall Protection': 'Due' }, policies: { 'Employee Handbook': true } },
      { id: 'emp-002', name: 'Rachel Angeline', role: 'Estimator', department: 'Preconstruction', startDate: '2026-02-01', status: 'Onboarding', onboarding: { Profile: true, Documents: true, 'Safety training': false, Payroll: true, Ready: false }, training: { 'Safety Orientation': 'In progress' }, policies: { 'Employee Handbook': false } },
      { id: 'emp-003', name: 'Jason Frazier', role: 'Field Lead', department: 'Field', startDate: '2026-02-12', status: 'Active', onboarding: { Profile: true, Documents: true, 'Safety training': true, Payroll: true, Ready: true }, training: { 'Safety Orientation': 'Complete', 'Fall Protection': 'Complete' }, policies: { 'Employee Handbook': true, 'PPE Policy': true } }
    ],
    training: [
      { id: 'trn-001', title: 'Safety Orientation', owner: 'HR / Safety', dueDate: '2026-07-01', audience: 'All employees', status: 'Active' },
      { id: 'trn-002', title: 'Fall Protection', owner: 'Safety', dueDate: '2026-07-15', audience: 'Field employees', status: 'Active' },
      { id: 'trn-003', title: 'Neroa ERP Basics', owner: 'Admin', dueDate: '2026-07-10', audience: 'Office employees', status: 'Draft' }
    ],
    policies: [
      { id: 'pol-001', title: 'Employee Handbook', category: 'General HR', owner: 'HR', status: 'Published', summary: 'Company standards, attendance, conduct, and employee acknowledgements.' },
      { id: 'pol-002', title: 'PPE Policy', category: 'Safety', owner: 'Safety', status: 'Published', summary: 'Required PPE, jobsite safety rules, and acknowledgement tracking.' },
      { id: 'pol-003', title: 'Timecard Policy', category: 'Payroll', owner: 'Accounting', status: 'Draft', summary: 'Clock-in, approval, corrections, and payroll cutoff.' }
    ]
  };
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function load() { try { return { ...clone(seed), ...(JSON.parse(localStorage.getItem(key)) || {}) }; } catch { return clone(seed); } }
  function save(state) { localStorage.setItem(key, JSON.stringify(state)); }
  function esc(value) { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }
  function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }
  function ensureStyle() {
    if (document.getElementById('hr-portal-live-style')) return;
    const style = document.createElement('style');
    style.id = 'hr-portal-live-style';
    style.textContent = `
      .hr-live-shell { display: grid; gap: 18px; width: calc(100vw - 44px); max-width: none; }
      .hr-live-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: start; }
      .hr-live-hero h1 { margin: 4px 0; font-size: clamp(34px, 5vw, 56px); }
      .hr-live-tabs, .hr-live-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      .hr-live-tabs button, .hr-live-actions button, .hr-small-btn { border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.06); color: var(--text); padding: 9px 13px; font-weight: 900; cursor: pointer; }
      .hr-live-tabs button.active, .hr-live-actions button.primary, .hr-small-btn.primary { border: 0; background: var(--brand-accent); color: #fff; }
      .hr-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .hr-metric, .hr-card, .hr-create { border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,.035); padding: 14px; }
      .hr-metric strong { display:block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
      .hr-metric b { display:block; font-size: 30px; margin-top: 4px; color: var(--text); }
      .hr-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
      .hr-create { display: grid; gap: 10px; }
      .hr-create-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; align-items: end; }
      .hr-create-grid.policy { grid-template-columns: 1.2fr .9fr .9fr .9fr 1.5fr auto; }
      .hr-create-grid.training { grid-template-columns: 1.2fr .9fr .9fr .9fr .9fr auto; }
      .hr-create label, .hr-card label { display: grid; gap: 5px; color: var(--muted); font-size: 12px; font-weight: 900; }
      .hr-create input, .hr-create select, .hr-create textarea, .hr-card input, .hr-card select { width: 100%; min-height: 40px; border: 1px solid rgba(255,255,255,.13); border-radius: 10px; background: rgba(0,0,0,.22); color: var(--text); padding: 8px 10px; font-weight: 800; box-sizing: border-box; }
      .hr-table { display: grid; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: rgba(255,255,255,.025); }
      .hr-row { display: grid; grid-template-columns: 1.15fr .9fr .8fr .7fr .75fr .7fr; align-items: stretch; border-bottom: 1px solid var(--line); }
      .hr-row.training { grid-template-columns: 1.25fr .8fr .8fr .9fr .7fr .75fr; }
      .hr-row.policy { grid-template-columns: 1.2fr .75fr .75fr .7fr 1.3fr .8fr; }
      .hr-cell { padding: 10px 12px; border-right: 1px solid var(--line); display: grid; align-items: center; min-height: 56px; }
      .hr-head { color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 950; background: rgba(0,0,0,.22); }
      .hr-pill { display: inline-flex; width: fit-content; border-radius: 999px; padding: 5px 9px; border: 1px solid var(--line); background: rgba(255,255,255,.06); color: var(--muted); font-size: 12px; font-weight: 900; }
      .hr-board { display: grid; grid-template-columns: repeat(5, minmax(170px, 1fr)); gap: 12px; }
      .hr-stage { border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,.035); padding: 12px; display: grid; gap: 10px; align-content: start; }
      .hr-stage h3 { margin: 0; }
      .hr-task { border: 1px solid rgba(255,255,255,.12); border-radius: 14px; background: rgba(0,0,0,.18); padding: 10px; display: grid; gap: 8px; }
      .hr-check { display: flex; gap: 8px; align-items: center; color: var(--text); font-weight: 850; }
      .hr-check input { width: auto; }
      @media (max-width: 1100px) { .hr-metrics, .hr-board { grid-template-columns: 1fr 1fr; } .hr-create-grid, .hr-create-grid.policy, .hr-create-grid.training { grid-template-columns: 1fr 1fr; } .hr-row, .hr-row.training, .hr-row.policy { min-width: 980px; } .hr-table { overflow-x: auto; } }
      @media (max-width: 700px) { .hr-metrics, .hr-board, .hr-create-grid, .hr-create-grid.policy, .hr-create-grid.training { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }
  function metrics(state) {
    const activeEmployees = state.employees.filter((e) => e.status === 'Active').length;
    const onboardingOpen = state.employees.filter((e) => !e.onboarding?.Ready).length;
    const activeTraining = state.training.filter((t) => t.status !== 'Archived').length;
    const publishedPolicies = state.policies.filter((p) => p.status === 'Published').length;
    return { activeEmployees, onboardingOpen, activeTraining, publishedPolicies };
  }
  function employeeProgress(employee) {
    const done = onboardingSteps.filter((step) => employee.onboarding?.[step]).length;
    return pct(done, onboardingSteps.length);
  }
  function renderEmployees(state) {
    return `<div class="hr-grid"><section class="hr-create"><h2>Add employee</h2><div class="hr-create-grid"><label>Name<input data-field="newEmployee.name" value="${esc(state.newEmployee.name)}" /></label><label>Role<input data-field="newEmployee.role" value="${esc(state.newEmployee.role)}" /></label><label>Department<input data-field="newEmployee.department" value="${esc(state.newEmployee.department)}" /></label><label>Start date<input type="date" data-field="newEmployee.startDate" value="${esc(state.newEmployee.startDate)}" /></label><label>Status<select data-field="newEmployee.status"><option${state.newEmployee.status === 'Onboarding' ? ' selected' : ''}>Onboarding</option><option${state.newEmployee.status === 'Active' ? ' selected' : ''}>Active</option><option${state.newEmployee.status === 'Inactive' ? ' selected' : ''}>Inactive</option></select></label><button class="hr-small-btn primary" data-action="add-employee">Create</button></div></section><section class="hr-table"><div class="hr-row hr-head"><div class="hr-cell">Employee</div><div class="hr-cell">Role</div><div class="hr-cell">Department</div><div class="hr-cell">Start</div><div class="hr-cell">Status</div><div class="hr-cell">Onboarding</div></div>${state.employees.map((employee) => `<div class="hr-row"><div class="hr-cell"><strong>${esc(employee.name)}</strong></div><div class="hr-cell"><input data-employee="${employee.id}" data-prop="role" value="${esc(employee.role)}" /></div><div class="hr-cell"><input data-employee="${employee.id}" data-prop="department" value="${esc(employee.department)}" /></div><div class="hr-cell"><input type="date" data-employee="${employee.id}" data-prop="startDate" value="${esc(employee.startDate)}" /></div><div class="hr-cell"><select data-employee="${employee.id}" data-prop="status"><option${employee.status === 'Onboarding' ? ' selected' : ''}>Onboarding</option><option${employee.status === 'Active' ? ' selected' : ''}>Active</option><option${employee.status === 'Inactive' ? ' selected' : ''}>Inactive</option></select></div><div class="hr-cell"><span class="hr-pill">${employeeProgress(employee)}% complete</span></div></div>`).join('')}</section></div>`;
  }
  function renderOnboarding(state) {
    return `<div class="hr-board">${onboardingSteps.map((step) => `<section class="hr-stage"><h3>${esc(step)}</h3>${state.employees.map((employee) => `<article class="hr-task"><strong>${esc(employee.name)}</strong><small>${esc(employee.role)} · ${esc(employee.department)}</small><label class="hr-check"><input type="checkbox" data-action="toggle-onboarding" data-employee="${employee.id}" data-step="${esc(step)}" ${employee.onboarding?.[step] ? 'checked' : ''}/> ${employee.onboarding?.[step] ? 'Done' : 'Needs work'}</label></article>`).join('')}</section>`).join('')}</div>`;
  }
  function renderTraining(state) {
    return `<div class="hr-grid"><section class="hr-create"><h2>Create training</h2><div class="hr-create-grid training"><label>Training<input data-field="newTraining.title" value="${esc(state.newTraining.title)}" /></label><label>Owner<input data-field="newTraining.owner" value="${esc(state.newTraining.owner)}" /></label><label>Due date<input type="date" data-field="newTraining.dueDate" value="${esc(state.newTraining.dueDate)}" /></label><label>Audience<input data-field="newTraining.audience" value="${esc(state.newTraining.audience)}" /></label><label>Status<select data-field="newTraining.status"><option${state.newTraining.status === 'Draft' ? ' selected' : ''}>Draft</option><option${state.newTraining.status === 'Active' ? ' selected' : ''}>Active</option><option${state.newTraining.status === 'Archived' ? ' selected' : ''}>Archived</option></select></label><button class="hr-small-btn primary" data-action="add-training">Create</button></div></section><section class="hr-table"><div class="hr-row training hr-head"><div class="hr-cell">Training</div><div class="hr-cell">Owner</div><div class="hr-cell">Due</div><div class="hr-cell">Audience</div><div class="hr-cell">Status</div><div class="hr-cell">Action</div></div>${state.training.map((training) => `<div class="hr-row training"><div class="hr-cell"><strong>${esc(training.title)}</strong></div><div class="hr-cell"><input data-training="${training.id}" data-prop="owner" value="${esc(training.owner)}" /></div><div class="hr-cell"><input type="date" data-training="${training.id}" data-prop="dueDate" value="${esc(training.dueDate)}" /></div><div class="hr-cell"><input data-training="${training.id}" data-prop="audience" value="${esc(training.audience)}" /></div><div class="hr-cell"><select data-training="${training.id}" data-prop="status"><option${training.status === 'Draft' ? ' selected' : ''}>Draft</option><option${training.status === 'Active' ? ' selected' : ''}>Active</option><option${training.status === 'Archived' ? ' selected' : ''}>Archived</option></select></div><div class="hr-cell"><button class="hr-small-btn" data-action="assign-training" data-training="${training.id}">Assign</button></div></div>`).join('')}</section></div>`;
  }
  function renderPolicies(state) {
    return `<div class="hr-grid"><section class="hr-create"><h2>Create policy</h2><div class="hr-create-grid policy"><label>Policy<input data-field="newPolicy.title" value="${esc(state.newPolicy.title)}" /></label><label>Category<input data-field="newPolicy.category" value="${esc(state.newPolicy.category)}" /></label><label>Owner<input data-field="newPolicy.owner" value="${esc(state.newPolicy.owner)}" /></label><label>Status<select data-field="newPolicy.status"><option${state.newPolicy.status === 'Draft' ? ' selected' : ''}>Draft</option><option${state.newPolicy.status === 'Published' ? ' selected' : ''}>Published</option><option${state.newPolicy.status === 'Archived' ? ' selected' : ''}>Archived</option></select></label><label>Summary<input data-field="newPolicy.summary" value="${esc(state.newPolicy.summary)}" /></label><button class="hr-small-btn primary" data-action="add-policy">Create</button></div></section><section class="hr-table"><div class="hr-row policy hr-head"><div class="hr-cell">Policy</div><div class="hr-cell">Category</div><div class="hr-cell">Owner</div><div class="hr-cell">Status</div><div class="hr-cell">Summary</div><div class="hr-cell">Acknowledged</div></div>${state.policies.map((policy) => `<div class="hr-row policy"><div class="hr-cell"><strong>${esc(policy.title)}</strong></div><div class="hr-cell"><input data-policy="${policy.id}" data-prop="category" value="${esc(policy.category)}" /></div><div class="hr-cell"><input data-policy="${policy.id}" data-prop="owner" value="${esc(policy.owner)}" /></div><div class="hr-cell"><select data-policy="${policy.id}" data-prop="status"><option${policy.status === 'Draft' ? ' selected' : ''}>Draft</option><option${policy.status === 'Published' ? ' selected' : ''}>Published</option><option${policy.status === 'Archived' ? ' selected' : ''}>Archived</option></select></div><div class="hr-cell"><input data-policy="${policy.id}" data-prop="summary" value="${esc(policy.summary)}" /></div><div class="hr-cell"><span class="hr-pill">${state.employees.filter((employee) => employee.policies?.[policy.title]).length}/${state.employees.length}</span></div></div>`).join('')}</section></div>`;
  }
  function renderBody(state) { if (state.tab === 'onboarding') return renderOnboarding(state); if (state.tab === 'training') return renderTraining(state); if (state.tab === 'policies') return renderPolicies(state); return renderEmployees(state); }
  function render(workspace, state) {
    const m = metrics(state);
    workspace.dataset.hrLive = 'true';
    workspace.innerHTML = `<section class="hr-live-shell"><header class="workspace-header panel hr-live-hero"><div><p class="eyebrow">Canonical live module</p><h1>HR Portal</h1><p>Active employee records, onboarding, training assignments, and policy acknowledgement tracking.</p></div><div class="live-badge">HR live</div></header><div class="hr-metrics"><div class="hr-metric"><strong>Active employees</strong><b>${m.activeEmployees}</b><span>${state.employees.length} total records</span></div><div class="hr-metric"><strong>Onboarding open</strong><b>${m.onboardingOpen}</b><span>employees not ready</span></div><div class="hr-metric"><strong>Training modules</strong><b>${m.activeTraining}</b><span>active or draft</span></div><div class="hr-metric"><strong>Published policies</strong><b>${m.publishedPolicies}</b><span>ready for acknowledgement</span></div></div><nav class="hr-live-tabs"><button data-tab="employees" class="${state.tab === 'employees' ? 'active' : ''}">Employees</button><button data-tab="onboarding" class="${state.tab === 'onboarding' ? 'active' : ''}">Onboarding</button><button data-tab="training" class="${state.tab === 'training' ? 'active' : ''}">Training</button><button data-tab="policies" class="${state.tab === 'policies' ? 'active' : ''}">Policies</button></nav>${renderBody(state)}</section>`;
    bind(workspace, state);
  }
  function bind(workspace, state) {
    workspace.onclick = (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) { state.tab = tab.dataset.tab; save(state); render(workspace, state); return; }
      const action = event.target.closest('[data-action]');
      if (!action) return;
      const act = action.dataset.action;
      if (act === 'add-employee') { const item = { ...state.newEmployee, id: uid('emp'), onboarding: {}, training: {}, policies: {} }; onboardingSteps.forEach((step) => { item.onboarding[step] = false; }); if (!item.name.trim()) return; state.employees.unshift(item); state.newEmployee = { ...blankEmployee }; }
      if (act === 'add-training') { const item = { ...state.newTraining, id: uid('trn') }; if (!item.title.trim()) return; state.training.unshift(item); state.newTraining = { ...blankTraining }; }
      if (act === 'add-policy') { const item = { ...state.newPolicy, id: uid('pol') }; if (!item.title.trim()) return; state.policies.unshift(item); state.newPolicy = { ...blankPolicy }; }
      if (act === 'toggle-onboarding') { const employee = state.employees.find((e) => e.id === action.dataset.employee); if (employee) { employee.onboarding = employee.onboarding || {}; employee.onboarding[action.dataset.step] = action.checked; } }
      if (act === 'assign-training') { const training = state.training.find((t) => t.id === action.dataset.training); if (training) state.employees.forEach((employee) => { employee.training = employee.training || {}; employee.training[training.title] = employee.training[training.title] || 'Assigned'; }); }
      save(state); render(workspace, state);
    };
    workspace.onchange = workspace.oninput = (event) => {
      const el = event.target;
      const value = el.type === 'checkbox' ? el.checked : el.value;
      const field = el.dataset.field;
      if (field) { const [group, prop] = field.split('.'); state[group][prop] = value; save(state); return; }
      if (el.dataset.employee) { const employee = state.employees.find((e) => e.id === el.dataset.employee); if (employee) employee[el.dataset.prop] = value; save(state); return; }
      if (el.dataset.training) { const training = state.training.find((t) => t.id === el.dataset.training); if (training) training[el.dataset.prop] = value; save(state); return; }
      if (el.dataset.policy) { const policy = state.policies.find((p) => p.id === el.dataset.policy); if (policy) policy[el.dataset.prop] = value; save(state); return; }
    };
  }
  function boot() {
    if (location.pathname.replace(/\/$/, '') !== HR_PATH) return;
    ensureStyle();
    const workspace = document.querySelector('.workspace');
    if (!workspace) return setTimeout(boot, 80);
    if (workspace.dataset.hrLive === 'true') return;
    render(workspace, load());
  }
  window.addEventListener('popstate', () => setTimeout(boot, 60));
  new MutationObserver(() => setTimeout(boot, 40)).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(boot, 80);
  setTimeout(boot, 500);
})();
