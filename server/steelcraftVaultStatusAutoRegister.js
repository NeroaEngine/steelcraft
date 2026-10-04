import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function sha256File(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function envValue(name) {
  return process.env[name] || null;
}

function partitionStatus(vaultRoot, binding) {
  const partitions = binding?.partitions || {};
  return Object.entries(partitions).map(([key, folder]) => {
    const absolutePath = vaultRoot && folder ? path.join(vaultRoot, folder) : null;
    return {
      key,
      folder,
      exists: Boolean(absolutePath && fs.existsSync(absolutePath)),
      path: absolutePath
    };
  });
}

function vaultStatus() {
  const bindingFile = envValue('NEROA_VAULT_BINDING_FILE');
  const vaultRoot = envValue('NEROA_VAULT_ROOT');
  const binding = bindingFile ? readJsonFile(bindingFile) : null;
  const partitions = partitionStatus(vaultRoot, binding);
  const expectedCustomer = envValue('NEROA_CUSTOMER_ID');
  const expectedWorkspace = envValue('NEROA_WORKSPACE_ID');
  const expectedVault = envValue('NEROA_CANONICAL_VAULT_ID');
  const ok = Boolean(
    binding &&
    expectedCustomer === binding.customer_id &&
    expectedWorkspace === binding.workspace_id &&
    expectedVault === binding.canonical_vault_id &&
    envValue('NEROA_POLICY_MODE') === 'fail_closed' &&
    envValue('NEROA_GUARD_REQUIRED') === 'true' &&
    envValue('NEROA_POLICYBOUND_REQUIRED') === 'true' &&
    envValue('NEROA_DIRECT_VAULT_WRITE') === 'false' &&
    envValue('NEROA_DIRECT_BLOCKCHAIN_WRITE') === 'false' &&
    fs.existsSync(vaultRoot || '') &&
    partitions.length > 0 &&
    partitions.every((item) => item.exists)
  );

  return {
    ok,
    customerId: expectedCustomer,
    workspaceId: expectedWorkspace,
    canonicalVaultId: expectedVault,
    vaultHost: envValue('NEROA_VAULT_HOST'),
    vaultRoot,
    bindingFile,
    bindingSha256: bindingFile ? sha256File(bindingFile) : null,
    policyMode: envValue('NEROA_POLICY_MODE'),
    guardRequired: envValue('NEROA_GUARD_REQUIRED') === 'true',
    policyBoundRequired: envValue('NEROA_POLICYBOUND_REQUIRED') === 'true',
    directVaultWrite: envValue('NEROA_DIRECT_VAULT_WRITE') === 'true',
    directBlockchainWrite: envValue('NEROA_DIRECT_BLOCKCHAIN_WRITE') === 'true',
    crossCustomerAccess: binding?.cross_customer_access || null,
    canonicalVaultCreation: binding?.canonical_vault_creation || null,
    sdk2AttachOnly: binding?.sdk2_attach_only === true,
    runtimeReceiptsRequired: binding?.runtime_receipts_required === true,
    partitions,
    generatedAt: new Date().toISOString()
  };
}

function registerSteelcraftVaultStatusRoutes(app) {
  if (app.__steelcraftVaultStatusRoutesRegistered) return;
  app.__steelcraftVaultStatusRoutesRegistered = true;

  app.get('/api/steelcraft/vault/status', (req, res) => {
    const status = vaultStatus();
    res.status(status.ok ? 200 : 500).json(status);
  });

  app.get('/api/vault/status', (req, res) => {
    const status = vaultStatus();
    res.status(status.ok ? 200 : 500).json(status);
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftVaultStatusAutoRegister) {
  express.application.listen = function patchedSteelcraftVaultStatusListen(...args) {
    registerSteelcraftVaultStatusRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__steelcraftVaultStatusAutoRegister', { value: true });
}
