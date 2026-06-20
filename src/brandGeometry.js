const STORAGE_KEY = 'steelcraft_brand_controls_v1';

const geometryDefaults = {
  bubbleWidth: 100,
  bubbleMinHeight: 0,
  portalButtonHeight: 92,
  portalButtonPaddingX: 14,
  portalButtonPaddingY: 14,
  cardMinHeight: 0,
  cardMaxWidth: 100,
  workspaceColumns: 135,
  headerHeight: 68,
  logoSize: 72
};

const controls = [
  ['bubbleWidth', 'Bubble width', 45, 160, '%'],
  ['bubbleMinHeight', 'Bubble minimum height', 0, 360, 'px'],
  ['portalButtonHeight', 'Portal/nav bubble height', 42, 220, 'px'],
  ['portalButtonPaddingX', 'Bubble side padding', 4, 48, 'px'],
  ['portalButtonPaddingY', 'Bubble top/bottom padding', 4, 48, 'px'],
  ['cardMinHeight', 'Main card minimum height', 0, 520, 'px'],
  ['cardMaxWidth', 'Workspace max width', 55, 100, '%'],
  ['workspaceColumns', 'Left/right card balance', 70, 180, '%'],
  ['headerHeight', 'Top bar height', 58, 180, 'px'],
  ['logoSize', 'Logo size', 24, 240, 'px']
];

function readBrand() {
  try {
    return { ...geometryDefaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return { ...geometryDefaults };
  }
}

function savePatch(patch) {
  const current = readBrand();
  const next = { ...current, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function unitValue(value, unit) {
  if (unit === '%') return `${value}%`;
  return `${value}px`;
}

function applyGeometry() {
  const brand = readBrand();
  const roots = document.querySelectorAll('.dashboard, .landing-dark');
  roots.forEach((root) => {
    root.style.setProperty('--bubble-width', unitValue(brand.bubbleWidth ?? geometryDefaults.bubbleWidth, '%'));
    root.style.setProperty('--bubble-min-height', unitValue(brand.bubbleMinHeight ?? geometryDefaults.bubbleMinHeight, 'px'));
    root.style.setProperty('--portal-button-height', unitValue(brand.portalButtonHeight ?? geometryDefaults.portalButtonHeight, 'px'));
    root.style.setProperty('--portal-button-padding-x', unitValue(brand.portalButtonPaddingX ?? geometryDefaults.portalButtonPaddingX, 'px'));
    root.style.setProperty('--portal-button-padding-y', unitValue(brand.portalButtonPaddingY ?? geometryDefaults.portalButtonPaddingY, 'px'));
    root.style.setProperty('--card-min-height', unitValue(brand.cardMinHeight ?? geometryDefaults.cardMinHeight, 'px'));
    root.style.setProperty('--card-max-width', unitValue(brand.cardMaxWidth ?? geometryDefaults.cardMaxWidth, '%'));
    root.style.setProperty('--workspace-left', `${brand.workspaceColumns ?? geometryDefaults.workspaceColumns}fr`);
    root.style.setProperty('--workspace-right', '100fr');
    root.style.setProperty('--header-height', unitValue(brand.headerHeight ?? geometryDefaults.headerHeight, 'px'));
    root.style.setProperty('--logo-size', unitValue(brand.logoSize ?? geometryDefaults.logoSize, 'px'));
  });
}

function makeRangeControl(key, label, min, max, unit) {
  const brand = readBrand();
  const value = brand[key] ?? geometryDefaults[key];
  const wrapper = document.createElement('label');
  wrapper.className = 'range-control geometry-range-control';
  wrapper.innerHTML = `<span>${label}<b>${value}${unit}</b></span><input type="range" min="${min}" max="${max}" value="${value}" />`;
  const input = wrapper.querySelector('input');
  const display = wrapper.querySelector('b');
  input.addEventListener('input', () => {
    const nextValue = Number(input.value);
    display.textContent = `${nextValue}${unit}`;
    savePatch({ [key]: nextValue });
    applyGeometry();
  });
  return wrapper;
}

function createPresetButton(label, patch) {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<strong>${label}</strong>`;
  button.addEventListener('click', () => {
    savePatch(patch);
    applyGeometry();
    const panel = document.querySelector('[data-brand-geometry-panel="true"]');
    if (panel) panel.remove();
    setTimeout(injectGeometryPanel, 0);
  });
  return button;
}

function injectGeometryPanel() {
  if (location.pathname.replace(/\/$/, '') !== '/brand') return;
  if (document.querySelector('[data-brand-geometry-panel="true"]')) return;
  const grid = document.querySelector('.brand-studio-grid');
  if (!grid) return;

  const panel = document.createElement('article');
  panel.className = 'feature panel geometry-panel';
  panel.dataset.brandGeometryPanel = 'true';
  panel.innerHTML = `
    <h2>Bubble geometry controls</h2>
    <p>Control the actual ERP bubble/card shape: square, rectangle, tall, wide, compact, or oversized. These controls affect nav bubbles, work cards, header height, and logo sizing.</p>
    <div class="choice-grid compact geometry-presets"></div>
    <div class="geometry-slider-grid"></div>
  `;

  const presets = panel.querySelector('.geometry-presets');
  presets.appendChild(createPresetButton('Square ERP', { bubbleWidth: 100, bubbleMinHeight: 0, portalButtonHeight: 82, portalButtonPaddingX: 12, portalButtonPaddingY: 12, cardMinHeight: 240, cardMaxWidth: 100, workspaceColumns: 120, headerHeight: 74 }));
  presets.appendChild(createPresetButton('Wide rectangles', { bubbleWidth: 100, bubbleMinHeight: 0, portalButtonHeight: 64, portalButtonPaddingX: 24, portalButtonPaddingY: 10, cardMinHeight: 180, cardMaxWidth: 100, workspaceColumns: 160, headerHeight: 76 }));
  presets.appendChild(createPresetButton('Tall bubbles', { bubbleWidth: 100, bubbleMinHeight: 150, portalButtonHeight: 142, portalButtonPaddingX: 22, portalButtonPaddingY: 24, cardMinHeight: 360, cardMaxWidth: 100, workspaceColumns: 100, headerHeight: 92 }));
  presets.appendChild(createPresetButton('Compact rows', { bubbleWidth: 100, bubbleMinHeight: 0, portalButtonHeight: 48, portalButtonPaddingX: 10, portalButtonPaddingY: 6, cardMinHeight: 140, cardMaxWidth: 100, workspaceColumns: 170, headerHeight: 62 }));
  presets.appendChild(createPresetButton('Kiosk blocks', { bubbleWidth: 100, bubbleMinHeight: 220, portalButtonHeight: 180, portalButtonPaddingX: 32, portalButtonPaddingY: 32, cardMinHeight: 460, cardMaxWidth: 96, workspaceColumns: 100, headerHeight: 120, logoSize: 130 }));
  presets.appendChild(createPresetButton('Narrow cards', { bubbleWidth: 72, bubbleMinHeight: 0, portalButtonHeight: 86, portalButtonPaddingX: 14, portalButtonPaddingY: 14, cardMinHeight: 220, cardMaxWidth: 78, workspaceColumns: 100, headerHeight: 76 }));

  const sliderGrid = panel.querySelector('.geometry-slider-grid');
  controls.forEach((control) => sliderGrid.appendChild(makeRangeControl(...control)));
  grid.prepend(panel);
  applyGeometry();
}

const CRM_CONTACTS_STORAGE_KEY = 'steelcraft_crm_records_v15';
const CRM_CONTACTS_BOARD_ID = '1781806557';

const contactBoardRows1781806557 = [["9910767289","Aaron Schrey","General Contractors","Tallen Builders, LLC","","13862326217","aschrey@tallenbuilders.com",""]];

function crmSlug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'record';
}

function crmAccountIdForName(name) {
  return name ? `acc-board-${crmSlug(name)}` : '';
}

function crmHasImportedContactNames(records = []) {
  return records.some((record) => /^imported\s+contact(?:\s+\d+)?$/i.test(String(record?.name || '').trim()));
}

function crmBuildContactsFromBoardRows() {
  return contactBoardRows1781806557.map(([itemId, name, type, linkedAccount, title, phone, email, notes], index) => {
    const accountId = crmAccountIdForName(linkedAccount);
    return {
      id: `con-${itemId || CRM_CONTACTS_BOARD_ID + '-' + index}`,
      name,
      type: type || 'No Label',
      accountId,
      linkedAccount: linkedAccount || '',
      title: title || '',
      phone: phone || '',
      email: email || '',
      url: '',
      emailProviderLink: '',
      emailProviderName: '',
      emailProviderId: '',
      emailProviderStatus: '',
      notes: notes || '',
      notesLog: [],
      emailLog: [],
      itemId: itemId || `${CRM_CONTACTS_BOARD_ID}-${index + 1}`
    };
  });
}

function crmBuildAccountsFromContacts(contacts = []) {
  const byAccount = new Map();
  contacts.forEach((contact) => {
    const accountName = String(contact.linkedAccount || '').trim();
    if (!accountName) return;
    const id = contact.accountId || crmAccountIdForName(accountName);
    if (!byAccount.has(id)) {
      byAccount.set(id, {
        id,
        name: accountName,
        type: 'Contacts Board Account',
        domain: '',
        industry: '',
        contacts: [],
        itemId: id.replace(/^acc-board-/, ''),
        accountEmail: '',
        emailProviderLink: '',
        emailProviderName: '',
        emailProviderId: '',
        emailProviderStatus: '',
        neroaLink: '',
        notes: '',
        notesLog: [],
        emailLog: [],
        description: '',
        employees: '',
        headquarters: '',
        salesEstimating: ''
      });
    }
    byAccount.get(id).contacts.push(contact.name);
  });
  return Array.from(byAccount.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function repairCrmContactsBoardNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(CRM_CONTACTS_STORAGE_KEY) || 'null');
    const savedContacts = Array.isArray(saved?.contacts) ? saved.contacts : [];
    const needsRepair = !savedContacts.length || crmHasImportedContactNames(savedContacts);
    if (!needsRepair) return;

    const contacts = crmBuildContactsFromBoardRows();
    const savedAccounts = Array.isArray(saved?.accounts) && saved.accounts.length ? saved.accounts : [];
    const hasBadAccountContacts = savedAccounts.some((account) => crmHasImportedContactNames(account?.contacts || []));
    const accounts = savedAccounts.length && !hasBadAccountContacts ? savedAccounts : crmBuildAccountsFromContacts(contacts);

    localStorage.setItem(CRM_CONTACTS_STORAGE_KEY, JSON.stringify({
      ...(saved || {}),
      accounts,
      contacts,
      repairedFromBoardId: CRM_CONTACTS_BOARD_ID,
      repairedAt: new Date().toISOString()
    }));
  } catch {
    const contacts = crmBuildContactsFromBoardRows();
    localStorage.setItem(CRM_CONTACTS_STORAGE_KEY, JSON.stringify({
      accounts: crmBuildAccountsFromContacts(contacts),
      contacts,
      repairedFromBoardId: CRM_CONTACTS_BOARD_ID,
      repairedAt: new Date().toISOString()
    }));
  }
}

function start() {
  repairCrmContactsBoardNames();
  applyGeometry();
  injectGeometryPanel();
  const observer = new MutationObserver(() => {
    applyGeometry();
    injectGeometryPanel();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
