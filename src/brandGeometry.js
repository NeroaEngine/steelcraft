const STORAGE_KEY = 'steelcraft_brand_controls_v1';
const CRM_CONTACTS_STORAGE_KEY = 'steelcraft_crm_records_v15';
const CRM_CONTACTS_BOARD_ID = '1781806557';

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

const contactNames1781806557 = `Aaron Schrey\nAllen Curry\nAndy Wilkin\nAustin Sinclair\nBen Leach\nBen Smith\nBender Middlekauff\nBill Sheaffer\nBob Bull\nBrandon Ferrer\nBrandon Owen\nBrian Findley\nBrian Munz\nBrian Sawyer\nBrian Troup\nBrock Smith\nBryan McKinley\nChandler Hall\nCharles Bates\nCharlie Cailliau\nCheney Simmons\nChris Bennett\nChris Tatum\nChuck Grijalva\nCody Laverdiere\nCole Stringer\nColton Cameron\nCurtis Abbot\nDane Chrestensen\nDanny\nDave Boyd\nDave Mitchell\nDavid Verdugo\nDenise Marschhauser\nDenver Beck\nDerek Bastel\nDerek Greeley\nDon Davis\nDon Sloan\nDonnie Deveau\nDuane Schock\nDustin Enoch\nDustin Garrett\nEian Guidry\nEric Coln\nEric Darveau\nEric Escamilla\nEric Escmilla\nEric Main\nFestus Barup\nGary Goodwin\nGina Young\nGumer Alvarez\nHarrison Bobbitt\nHarvey Cohen\nIan Nichols\nJamie Blunt\nJamie Ordway\nJani Marais\nJason Atkins\nJason Frazier\nJazmin Miller\nJeff Schoeler\nJen Bullard\nJeremiah Bennett\nJerome Turvin\nJerry Marshall\nJessica Smith\nJim Lees\nJim Ross\nJoey Stathas\nJohn Delesline\nJohn Milligan\nJohn Rankin\nJoseph Campbell\nJoseph Collins\nJosh Long\nJoshua Arnold\nKarrie Fitzgerald\nKelly Lehman\nKen McElfresh\nKendall Drake\nKenneth Powell\nKirk Austin\nKlint Battien\nKolin Gasper\nKristen Sigley\nKristen Young\nKyle Siebert\nLarry Amyotte\nLeo Amaya\nMark Obenour\nMark Obenour\nMark Shafer\nMatthew Murphy\nMelissa Woltz\nMichael Wiechens\nMichale Miller\nMike Boyle\nMike Dushane\nMike Kretzinger\nMike O'Malley\nMike O'Malley\nMike Wilkins\nNick Jackowski\nNolan Galloway lll\nPatrick Altier\nPaul Gaynor\nPaul Ironmonmonger\nPerry Petrillo\nRachel Angeline\nRachel Gibbs\nRafe Stewart\nRamiz Hadad\nRamon Perez\nRay Koste\nRay Purgert\nRenee De La Cruz\nRichard Faulks\nRob Hennessey\nRobert Boyer\nRussell Lee's Jr\nSara Jessup\nScott Roth\nScott Schmidt\nSeth Mcbride\nShane Ferguson\nShawn Robinson\nStephen Feher\nSteve Anderson\nSteve Anderson\nSteve Anderson\nSteve Apat\nSteve Mullins\nSteven Mendez\nSusie Blanchard\nTaylor Shaw\nTim McCord\nTj Kelley\nTodd Walker\nTony Wright\nTracy Swanson\nWill Poole\nWilliam Futch\nYanery Quintero\nZach Farrer\nKristina Walker\nShawn Walker\nJustin R. Hammond\nSean Donnelly\nAlvaro Sanchez\nSean Donnelly\nJim Walkup\nDylan Drake\nLogan Justus\nSamual Ackerman\nRob Blount\nMatt Metzcus\nKillian Quilty\nJonathan King\nMarty Eyer\nAmine Harb\nCurtis Abbott\nMark Chafin\nObtain Code Testing 2\nRobert Szczesny\nMark Watkins\nRon Brown\nIan Moore\nCompass Construction, Inc.\nAnnette Foskey\nThomas Townsend\nLee Stasch\nMichele Colasuonno\nAdam Wyckoff\nKillian Quilty\nLimreal Blanc\nTracy Glover\nJay Veillette\nBenjamin Cerritos\nLindsey Jarrell\nLimreal Blanc\nCarl Leneis\nCarl Leneis`.split('\n').filter(Boolean);

function readBrand() {
  try {
    return { ...geometryDefaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return { ...geometryDefaults };
  }
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

function crmHasImportedContactName(record = {}) {
  return /^imported\s+contact(?:\s+\d+)?$/i.test(String(record?.name || '').trim());
}

function crmBuildContactFromName(name, index) {
  return {
    id: `con-${CRM_CONTACTS_BOARD_ID}-${index + 1}`,
    name,
    type: 'No Label',
    accountId: '',
    linkedAccount: '',
    title: '',
    phone: '',
    email: '',
    url: '',
    emailProviderLink: '',
    emailProviderName: '',
    emailProviderId: '',
    emailProviderStatus: '',
    notes: '',
    notesLog: [],
    emailLog: [],
    itemId: `${CRM_CONTACTS_BOARD_ID}-${index + 1}`
  };
}

function repairCrmContactsBoardNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(CRM_CONTACTS_STORAGE_KEY) || 'null');
    const savedContacts = Array.isArray(saved?.contacts) ? saved.contacts : [];
    const needsRepair = !savedContacts.length || savedContacts.some(crmHasImportedContactName);
    if (!needsRepair) return;

    const contacts = savedContacts.length
      ? savedContacts.map((contact, index) => crmHasImportedContactName(contact) ? { ...contact, name: contactNames1781806557[index] || contact.name } : contact)
      : contactNames1781806557.map(crmBuildContactFromName);

    const accounts = Array.isArray(saved?.accounts) ? saved.accounts.map((account) => ({
      ...account,
      contacts: Array.isArray(account?.contacts) ? account.contacts.filter((contactName) => !/^imported\s+contact(?:\s+\d+)?$/i.test(String(contactName || '').trim())) : []
    })) : [];

    localStorage.setItem(CRM_CONTACTS_STORAGE_KEY, JSON.stringify({
      ...(saved || {}),
      accounts,
      contacts,
      repairedFromBoardId: CRM_CONTACTS_BOARD_ID,
      repairedAt: new Date().toISOString()
    }));
  } catch {
    localStorage.setItem(CRM_CONTACTS_STORAGE_KEY, JSON.stringify({
      accounts: [],
      contacts: contactNames1781806557.map(crmBuildContactFromName),
      repairedFromBoardId: CRM_CONTACTS_BOARD_ID,
      repairedAt: new Date().toISOString()
    }));
  }
}

function start() {
  repairCrmContactsBoardNames();
  applyGeometry();
  const observer = new MutationObserver(() => applyGeometry());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
