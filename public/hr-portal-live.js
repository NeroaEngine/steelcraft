(function () {
  const PATH = '/portal/hr';
  const KEY = 'steelcraft_hr_live_v5';
  const stages = ['Profile', 'Documents', 'Training', 'Payroll', 'Ready'];
  const emptyEmployee = { name: '', role: '', department: '', startDate: '', status: 'Onboarding', email: '', phone: '' };
  const emptyTraining = { title: '', owner: '', dueDate: '', audience: 'All employees', status: 'Draft' };
  const emptyPolicy = { title: '', category: '', owner: '', status: 'Draft', summary: '' };
  const seed = {
    tab: 'employees',
    draftEmployee: { ...emptyEmployee },
    draftTraining: { ...emptyTraining },
    draftPolicy: { ...emptyPolicy },
    employees: [
      { id: 'emp-colton', name: 'Colton Cameron', role: 'Head Project Manager / Estimator', department: 'Project Management', startDate: '', status: 'Active', email: 'colton@mariondevelopmentgroup.com', phone: '13523611818', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, policies: { 'Employee Handbook': true }, training: {} },
      { id: 'emp-seth', name: 'Seth McBride', role: 'President', department: 'Development', startDate: '2022-01-01', status: 'Active', email: 'seth@mariondevelopmentgroup.com', phone: '13522869466', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, policies: { 'Employee Handbook': true }, training: {} },
      { id: 'emp-bj', name: 'BJ Hammett', role: 'Partner', department: 'Sales', startDate: '2023-10-01', status: 'Active', email: '', phone: '', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, policies: { 'Employee Handbook': true }, training: {} },
      { id: 'emp-brad', name: 'Brad Hammett', role: 'Partner', department: 'Development', startDate: '2023-10-01', status: 'Active', email: 'brad@mariondevelopmentgroup.com', phone: '13524278803', onboarding: { Profile: true, Documents: true, Training: true, Payroll: true, Ready: true }, policies: { 'Employee Handbook': true }, training: {} }
    ],
    training: [
      { id: 'tr-safety', title: 'Safety Orientation', owner: 'HR / Safety', dueDate: '2026-07-01', audience: 'All employees', status: 'Active' },
      { id: 'tr-fall', title: 'Fall Protection', owner: 'Safety', dueDate: '2026-07-15', audience: 'Field employees', status: 'Active' },
      { id: 'tr-erp', title: 'Neroa ERP Basics', owner: 'Admin', dueDate: '2026-07-10', audience: 'Office employees', status: 'Draft' }
    ],
    policies: [
      { id: 'pol-handbook', title: 'Employee Handbook', category: 'General HR', owner: 'HR', status: 'Published', summary: 'Company standards, attendance, conduct, and employee acknowledgements.' },
      { id: 'pol-ppe', title: 'PPE Policy', category: 'Safety', owner: 'Safety', status: 'Published', summary: 'Required PPE and jobsite safety rules.' },
      { id: 'pol-timecard', title: 'Timecard Policy', category: 'Payroll', owner: 'Accounting', status: 'Draft', summary: 'Clock-in, approval, corrections, and payroll cutoff.' }
    ]
  };
  let state = null;
  let mountedRoot = null;
  let listenersReady = false;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function load() {
    try { return { ...clone(seed), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; }
    catch { return clone(seed); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function percent(employee) { return Math.round((stages.filter((stage) => employee.onboarding && employee.onboarding[stage]).length / stages.length) * 100); }
  function currentStage(employee) {
    let active = 'Profile';
    stages.forEach((stage) => { if (employee.onboarding && employee.onboarding[stage]) active = stage; });
    return active;
  }
  function setStage(employee, stage) {
    const index = stages.indexOf(stage);
    employee.onboarding = employee.onboarding || {};
    stages.forEach((item, itemIndex) => { employee.onboarding[item] = itemIndex <= index; });
    employee.status = stage === 'Ready' ? 'Active' : 'Onboarding';
  }
  function css() {
    if (document.getElementById('hr-live-v5-style')) return;
    const style = document.createElement('style');
    style.id = 'hr-live-v5-style';
    style.textContent = `
      .hr-live-v5{width:calc(100vw - 44px);display:grid;gap:14px;font-size:13px}.hr-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start}.hr-hero h1{margin:3px 0;font-size:34px;line-height:1}.hr-hero p{margin:0;color:var(--muted);font-size:13px}.hr-tabs,.hr-actions{display:flex;gap:8px;flex-wrap:wrap}.hr-tabs button,.hr-btn{border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.06);color:var(--text);padding:7px 10px;font-size:12px;font-weight:900;cursor:pointer}.hr-tabs button.active,.hr-btn.primary{border:0;background:var(--brand-accent);color:#fff}.hr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.hr-stat,.hr-panel,.hr-stage{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.035);padding:11px}.hr-stat strong{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.hr-stat b{display:block;color:var(--text);font-size:24px;margin-top:2px}.hr-stat span{font-size:11px;color:var(--muted)}.hr-form{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-items:end}.hr-form label,.hr-cell label{display:grid;gap:4px;color:var(--muted);font-size:11px;font-weight:900}.hr-form input,.hr-form select,.hr-table input,.hr-table select{width:100%;min-height:34px;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(0,0,0,.22);color:var(--text);padding:6px 8px;font-size:12px;font-weight:800;box-sizing:border-box}.hr-table{display:grid;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.025);overflow-x:auto}.hr-row{min-width:1180px;display:grid;grid-template-columns:1fr .85fr .85fr .75fr .75fr 1fr .65fr;border-bottom:1px solid var(--line)}.hr-row.training{grid-template-columns:1.25fr .8fr .8fr 1fr .7fr .7fr}.hr-row.policy{grid-template-columns:1.2fr .75fr .75fr .7fr 1.4fr .7fr}.hr-row.head{background:rgba(0,0,0,.22);color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-size:10px;font-weight:950}.hr-cell{min-height:46px;padding:8px 10px;border-right:1px solid var(--line);display:grid;align-items:center}.hr-cell strong{font-size:13px}.hr-cell small{font-size:11px;color:var(--muted)}.hr-pill{display:inline-flex;width:fit-content;border-radius:999px;padding:4px 8px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--muted);font-size:11px;font-weight:900}.hr-board{display:grid;grid-template-columns:repeat(5,minmax(170px,1fr));gap:10px}.hr-stage{min-height:320px;display:grid;gap:8px;align-content:start}.hr-stage.drag-over{outline:2px solid var(--brand-accent);background:rgba(159,61,66,.16)}.hr-stage h3{margin:0;display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:14px}.hr-drop-note{margin:0;color:var(--muted);font-size:11px}.hr-card{border:1px solid rgba(255,255,255,.14);border-radius:13px;background:rgba(0,0,0,.22);padding:9px;display:grid;gap:6px;cursor:grab}.hr-card strong{font-size:13px}.hr-card small{font-size:11px;color:var(--muted)}.hr-card:active{cursor:grabbing}.hr-card .hr-actions button{padding:5px 8px}.hr-muted{color:var(--muted)}@media(max-width:1100px){.hr-stats,.hr-board{grid-template-columns:1fr 1fr}.hr-form{grid-template-columns:1fr 1fr}}@media(max-width:720px){.hr-stats,.hr-board,.hr-form{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
  function field(name, key, label, options, type) {
    const value = state[name][key] || '';
    if (options) return `<label>${label}<select data-draft="${name}.${key}">${options.map((option) => `<option${value === option ? ' selected' : ''}>${option}</option>`).join('')}</select></label>`;
    return `<label>${label}<input ${type ? `type="${type}"` : ''} data-draft="${name}.${key}" value="${esc(value)}" /></label>`;
  }
  function form(name, fields, action, title) {
    return `<section class="hr-panel"><h2>${title}</h2><div class="hr-form">${fields.join('')}<button type="button" class="hr-btn primary" data-action="${action}">Create</button></div></section>`;
  }
  function employeesView() {
    return `${form('draftEmployee', [field('draftEmployee','name','Name'), field('draftEmployee','role','Role'), field('draftEmployee','department','Department'), field('draftEmployee','startDate','Start date',null,'date'), field('draftEmployee','status','Status',['Onboarding','Active','Inactive']), field('draftEmployee','email','Email')], 'add-employee', 'Create employee')}<section class="hr-table"><div class="hr-row head"><div class="hr-cell">Employee</div><div class="hr-cell">Role</div><div class="hr-cell">Department</div><div class="hr-cell">Start</div><div class="hr-cell">Status</div><div class="hr-cell">Email / Phone</div><div class="hr-cell">Progress</div></div>${state.employees.map((employee) => `<div class="hr-row"><div class="hr-cell"><strong>${esc(employee.name)}</strong></div><div class="hr-cell"><input data-emp="${employee.id}" data-prop="role" value="${esc(employee.role)}" /></div><div class="hr-cell"><input data-emp="${employee.id}" data-prop="department" value="${esc(employee.department)}" /></div><div class="hr-cell"><input type="date" data-emp="${employee.id}" data-prop="startDate" value="${esc(employee.startDate)}" /></div><div class="hr-cell"><select data-emp="${employee.id}" data-prop="status"><option${employee.status === 'Onboarding' ? ' selected' : ''}>Onboarding</option><option${employee.status === 'Active' ? ' selected' : ''}>Active</option><option${employee.status === 'Inactive' ? ' selected' : ''}>Inactive</option></select></div><div class="hr-cell"><small>${esc(employee.email)}<br/>${esc(employee.phone)}</small></div><div class="hr-cell"><span class="hr-pill">${percent(employee)}%</span></div></div>`).join('')}</section>`;
  }
  function onboardingView() {
    return `<div class="hr-board">${stages.map((stage) => {
      const cards = state.employees.filter((employee) => currentStage(employee) === stage);
      return `<section class="hr-stage" data-stage="${esc(stage)}"><h3>${esc(stage)} <span class="hr-pill">${cards.length}</span></h3><p class="hr-drop-note">Drag cards into this column.</p>${cards.map((employee) => `<article class="hr-card" draggable="true" data-emp-card="${employee.id}"><strong>${esc(employee.name)}</strong><small>${esc(employee.role)} · ${esc(employee.department)}</small><span class="hr-pill">${percent(employee)}% complete</span><div class="hr-actions"><button type="button" class="hr-btn" data-action="move-prev" data-emp="${employee.id}">Back</button><button type="button" class="hr-btn primary" data-action="move-next" data-emp="${employee.id}">Next</button></div></article>`).join('')}</section>`;
    }).join('')}</div>`;
  }
  function trainingView() {
    return `${form('draftTraining', [field('draftTraining','title','Training'), field('draftTraining','owner','Owner'), field('draftTraining','dueDate','Due date',null,'date'), field('draftTraining','audience','Audience'), field('draftTraining','status','Status',['Draft','Active','Archived'])], 'add-training', 'Create training')}<section class="hr-table"><div class="hr-row training head"><div class="hr-cell">Training</div><div class="hr-cell">Owner</div><div class="hr-cell">Due</div><div class="hr-cell">Audience</div><div class="hr-cell">Status</div><div class="hr-cell">Action</div></div>${state.training.map((training) => `<div class="hr-row training"><div class="hr-cell"><strong>${esc(training.title)}</strong></div><div class="hr-cell"><input data-training="${training.id}" data-prop="owner" value="${esc(training.owner)}" /></div><div class="hr-cell"><input type="date" data-training="${training.id}" data-prop="dueDate" value="${esc(training.dueDate)}" /></div><div class="hr-cell"><input data-training="${training.id}" data-prop="audience" value="${esc(training.audience)}" /></div><div class="hr-cell"><select data-training="${training.id}" data-prop="status"><option${training.status === 'Draft' ? ' selected' : ''}>Draft</option><option${training.status === 'Active' ? ' selected' : ''}>Active</option><option${training.status === 'Archived' ? ' selected' : ''}>Archived</option></select></div><div class="hr-cell"><button type="button" class="hr-btn" data-action="assign-training" data-training="${training.id}">Assign</button></div></div>`).join('')}</section>`;
  }
  function policiesView() {
    return `${form('draftPolicy', [field('draftPolicy','title','Policy'), field('draftPolicy','category','Category'), field('draftPolicy','owner','Owner'), field('draftPolicy','status','Status',['Draft','Published','Archived']), field('draftPolicy','summary','Summary')], 'add-policy', 'Create policy')}<section class="hr-table"><div class="hr-row policy head"><div class="hr-cell">Policy</div><div class="hr-cell">Category</div><div class="hr-cell">Owner</div><div class="hr-cell">Status</div><div class="hr-cell">Summary</div><div class="hr-cell">Ack</div></div>${state.policies.map((policy) => `<div class="hr-row policy"><div class="hr-cell"><strong>${esc(policy.title)}</strong></div><div class="hr-cell"><input data-policy="${policy.id}" data-prop="category" value="${esc(policy.category)}" /></div><div class="hr-cell"><input data-policy="${policy.id}" data-prop="owner" value="${esc(policy.owner)}" /></div><div class="hr-cell"><select data-policy="${policy.id}" data-prop="status"><option${policy.status === 'Draft' ? ' selected' : ''}>Draft</option><option${policy.status === 'Published' ? ' selected' : ''}>Published</option><option${policy.status === 'Archived' ? ' selected' : ''}>Archived</option></select></div><div class="hr-cell"><input data-policy="${policy.id}" data-prop="summary" value="${esc(policy.summary)}" /></div><div class="hr-cell"><span class="hr-pill">${state.employees.filter((employee) => employee.policies && employee.policies[policy.title]).length}/${state.employees.length}</span></div></div>`).join('')}</section>`;
  }
  function content() {
    if (state.tab === 'onboarding') return onboardingView();
    if (state.tab === 'training') return trainingView();
    if (state.tab === 'policies') return policiesView();
    return employeesView();
  }
  function render() {
    const root = mountedRoot;
    if (!root) return;
    const active = state.employees.filter((employee) => employee.status === 'Active').length;
    const open = state.employees.filter((employee) => !employee.onboarding || !employee.onboarding.Ready).length;
    root.dataset.hrLive = 'v5';
    root.innerHTML = `<section class="hr-live-v5"><header class="workspace-header panel hr-hero"><div><p class="eyebrow">HR Portal</p><h1>HR Portal</h1><p>Employees, movable onboarding cards, training, policies, and employee records.</p></div><div class="live-badge">Active HR</div></header><div class="hr-stats"><div class="hr-stat"><strong>Active</strong><b>${active}</b><span>${state.employees.length} employees</span></div><div class="hr-stat"><strong>Onboarding</strong><b>${open}</b><span>open cards</span></div><div class="hr-stat"><strong>Training</strong><b>${state.training.length}</b><span>modules</span></div><div class="hr-stat"><strong>Policies</strong><b>${state.policies.length}</b><span>records</span></div></div><nav class="hr-tabs"><button type="button" data-tab="employees" class="${state.tab === 'employees' ? 'active' : ''}">Employees</button><button type="button" data-tab="onboarding" class="${state.tab === 'onboarding' ? 'active' : ''}">Onboarding Board</button><button type="button" data-tab="training" class="${state.tab === 'training' ? 'active' : ''}">Training</button><button type="button" data-tab="policies" class="${state.tab === 'policies' ? 'active' : ''}">Policies</button></nav>${content()}</section>`;
  }
  function rerender() { save(); render(); }
  function action(button) {
    const type = button.dataset.action;
    if (type === 'add-employee') {
      const draft = state.draftEmployee;
      if (!draft.name.trim()) return;
      const employee = { ...draft, id: uid('emp'), onboarding: {}, training: {}, policies: {} };
      stages.forEach((stage) => { employee.onboarding[stage] = false; });
      state.employees.unshift(employee);
      state.draftEmployee = { ...emptyEmployee };
    }
    if (type === 'add-training') {
      const draft = state.draftTraining;
      if (!draft.title.trim()) return;
      state.training.unshift({ ...draft, id: uid('tr') });
      state.draftTraining = { ...emptyTraining };
    }
    if (type === 'add-policy') {
      const draft = state.draftPolicy;
      if (!draft.title.trim()) return;
      state.policies.unshift({ ...draft, id: uid('pol') });
      state.draftPolicy = { ...emptyPolicy };
    }
    if (type === 'assign-training') {
      const training = state.training.find((item) => item.id === button.dataset.training);
      if (training) state.employees.forEach((employee) => { employee.training = employee.training || {}; employee.training[training.title] = employee.training[training.title] || 'Assigned'; });
    }
    if (type === 'move-next' || type === 'move-prev') {
      const employee = state.employees.find((item) => item.id === button.dataset.emp);
      if (employee) {
        const index = stages.indexOf(currentStage(employee));
        setStage(employee, stages[type === 'move-next' ? Math.min(index + 1, stages.length - 1) : Math.max(index - 1, 0)]);
      }
    }
    rerender();
  }
  function events() {
    if (listenersReady) return;
    listenersReady = true;
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.hr-live-v5')) return;
      const tab = event.target.closest('[data-tab]');
      if (tab) { state.tab = tab.dataset.tab; rerender(); return; }
      const button = event.target.closest('[data-action]');
      if (button) action(button);
    });
    document.addEventListener('input', (event) => edit(event));
    document.addEventListener('change', (event) => edit(event));
    document.addEventListener('dragstart', (event) => {
      const card = event.target.closest('[data-emp-card]');
      if (!card) return;
      event.dataTransfer.setData('text/plain', card.dataset.empCard);
      event.dataTransfer.effectAllowed = 'move';
    });
    document.addEventListener('dragover', (event) => {
      const stage = event.target.closest('.hr-stage[data-stage]');
      if (!stage) return;
      event.preventDefault();
      stage.classList.add('drag-over');
    });
    document.addEventListener('dragleave', (event) => {
      const stage = event.target.closest('.hr-stage[data-stage]');
      if (stage) stage.classList.remove('drag-over');
    });
    document.addEventListener('drop', (event) => {
      const stage = event.target.closest('.hr-stage[data-stage]');
      if (!stage) return;
      event.preventDefault();
      stage.classList.remove('drag-over');
      const employee = state.employees.find((item) => item.id === event.dataTransfer.getData('text/plain'));
      if (employee) { setStage(employee, stage.dataset.stage); rerender(); }
    });
  }
  function edit(event) {
    const el = event.target;
    if (!el.closest('.hr-live-v5')) return;
    const draft = el.dataset.draft;
    if (draft) {
      const [group, prop] = draft.split('.');
      state[group][prop] = el.value;
      save();
      return;
    }
    const emp = el.dataset.emp ? state.employees.find((item) => item.id === el.dataset.emp) : null;
    if (emp) { emp[el.dataset.prop] = el.value; save(); return; }
    const training = el.dataset.training ? state.training.find((item) => item.id === el.dataset.training) : null;
    if (training) { training[el.dataset.prop] = el.value; save(); return; }
    const policy = el.dataset.policy ? state.policies.find((item) => item.id === el.dataset.policy) : null;
    if (policy) { policy[el.dataset.prop] = el.value; save(); }
  }
  function boot() {
    if (location.pathname.replace(/\/$/, '') !== PATH) return;
    css();
    events();
    const root = document.querySelector('.workspace');
    if (!root) return setTimeout(boot, 80);
    if (!state) state = load();
    mountedRoot = root;
    if (root.dataset.hrLive !== 'v5') render();
  }
  window.addEventListener('popstate', () => setTimeout(boot, 80));
  new MutationObserver(() => setTimeout(boot, 80)).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(boot, 80);
  setTimeout(boot, 700);
})();
