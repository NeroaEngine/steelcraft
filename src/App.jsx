import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AccountingPortal from './AccountingPortal.jsx';
import LiveCanonicalPortal, { isLiveCanonicalPortal } from './LiveCanonicalPortal.jsx';
import { canonicalPortals, defaultTenantModuleMap, getTenantPortals, industryPacks } from './portalRegistry.js';
import './styles.css';
import './brandGeometry.js';
import './brandThemePacks.js';
import './accountingLayout.css';
import './accountingHardLock.css';
import './liveCanonicalNoRunBubble.css';

const brandKey = 'steelcraft_brand_controls_v1';
const enabledKey = 'steelcraft_enabled_portals_v1';
const sessionKey = 'steelcraft_auth_session_v1';
const developerLockedKey = 'steelcraft_developer_room_locked';

const languages = [
  ['en', 'English'],
  ['es', 'Spanish / Espanol'],
  ['ht', 'Haitian Creole'],
  ['pt', 'Portuguese'],
  ['fr', 'French'],
  ['de', 'German']
];

function portalTuple(portal) {
  return [portal.id, portal.title, portal.kind, portal.description, portal];
}

const tenantModuleMap = defaultTenantModuleMap;