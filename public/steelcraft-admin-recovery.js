(function () {
  var enabledKey = 'steelcraft_enabled_portals_v1';
  var brandKey = 'steelcraft_brand_controls_v1';
  var crmKey = 'steelcraft_crm_records_v15';
  var mandatory = ['admin', 'contacts', 'accounting', 'employee', 'vendor', 'customer', 'hr'];

  function readJson(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key));
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function repairEnabledPortals() {
    var saved = readJson(enabledKey, []);
    if (!Array.isArray(saved)) saved = [];
    var next = Array.from(new Set(mandatory.concat(saved)));
    writeJson(enabledKey, next);
  }

  function repairBrand() {
    var brand = readJson(brandKey, {});
    if (!brand || typeof brand !== 'object') brand = {};
    if (!brand.logoUrl || brand.logoMode === 'initials' || brand.logoMode === 'text') {
      brand.logoUrl = '/brand/scb-logo.png';
      brand.logoMode = 'image';
      brand.logoShape = 'wide';
      brand.logoSize = 170;
      writeJson(brandKey, brand);
    }
  }

  function quarantineBrokenCrmLocalStorage() {
    var saved = readJson(crmKey, null);
    if (!saved) return;

    var accounts = Array.isArray(saved.accounts) ? saved.accounts : [];
    var contacts = Array.isArray(saved.contacts) ? saved.contacts : [];

    var looksBroken =
      !accounts.length ||
      !contacts.length ||
      contacts.length < 25 ||
      accounts.length < 25 ||
      contacts.some(function (contact) { return contact && typeof contact === 'object' && !contact.name && !contact.linkedAccount; });

    if (looksBroken) {
      var backupKey = crmKey + '_quarantined_' + new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      writeJson(backupKey, saved);
      localStorage.removeItem(crmKey);
      localStorage.setItem('steelcraft_crm_recovery_notice', 'Broken CRM localStorage was quarantined and seed CRM data was restored. Backup key: ' + backupKey);
    }
  }

  repairEnabledPortals();
  repairBrand();
  quarantineBrokenCrmLocalStorage();
}());
