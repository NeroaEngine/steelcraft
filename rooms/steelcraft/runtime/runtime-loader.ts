export type RuntimePackage = {
  packageId: string;
  name: string;
  version: string;
  runtime: string;
  status: string;
  roomManifest: string;
  worker: string;
  registries: Record<string, string>;
  componentLibrary: string;
  primarySpine: string;
  runtimeBoundaries: Record<string, string[]>;
  entryCards: string[];
};

export type LoadedRuntime = {
  package: RuntimePackage;
  loadedAt: string;
  health: {
    ok: boolean;
    missing: string[];
    warnings: string[];
  };
};

export async function loadSteelCraftRuntime(runtimePackage: RuntimePackage): Promise<LoadedRuntime> {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!runtimePackage.packageId) missing.push('packageId');
  if (!runtimePackage.roomManifest) missing.push('roomManifest');
  if (!runtimePackage.worker) missing.push('worker');
  if (!runtimePackage.primarySpine) missing.push('primarySpine');
  if (!runtimePackage.componentLibrary) warnings.push('componentLibrary not configured');

  for (const key of ['entities', 'cards', 'workflows', 'imports', 'receipts']) {
    if (!runtimePackage.registries?.[key]) missing.push(`registries.${key}`);
  }

  return {
    package: runtimePackage,
    loadedAt: new Date().toISOString(),
    health: {
      ok: missing.length === 0,
      missing,
      warnings
    }
  };
}
