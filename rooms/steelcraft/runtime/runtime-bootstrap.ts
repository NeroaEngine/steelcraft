import { loadSteelCraftRuntime, type RuntimePackage, type LoadedRuntime } from './runtime-loader';
import { createSteelCraftRuntimeRouter } from './runtime-router';

export type ForgeLikeRuntime = {
  registerRoom?: (room: Record<string, unknown>) => unknown | Promise<unknown>;
  registerRuntimePackage?: (runtimePackage: Record<string, unknown>) => unknown | Promise<unknown>;
  registerRouter?: (roomId: string, router: Record<string, unknown>) => unknown | Promise<unknown>;
  emitReceipt?: (receipt: Record<string, unknown>) => unknown | Promise<unknown>;
};

export type BootstrapOptions = {
  forge?: ForgeLikeRuntime;
  runtimePackage: RuntimePackage;
  roomManifest: Record<string, unknown>;
  universeManifest?: Record<string, unknown>;
};

export type BootstrapResult = {
  ok: boolean;
  roomId: string;
  loadedRuntime: LoadedRuntime;
  router: ReturnType<typeof createSteelCraftRuntimeRouter>;
  receipts: Record<string, unknown>[];
};

function makeReceipt(event: string, payload: Record<string, unknown> = {}) {
  return {
    ok: true,
    event,
    room: 'steelcraft-room',
    tenant_key: 'steelcraft',
    generatedAt: new Date().toISOString(),
    source: 'runtime-bootstrap.ts',
    payload
  };
}

export async function bootstrapSteelCraftRuntime(options: BootstrapOptions): Promise<BootstrapResult> {
  const loadedRuntime = await loadSteelCraftRuntime(options.runtimePackage);
  const router = createSteelCraftRuntimeRouter();
  const receipts: Record<string, unknown>[] = [];

  const hydrationReceipt = makeReceipt('room_hydrated', {
    runtimePackage: options.runtimePackage.packageId,
    room: options.roomManifest.room_id || options.roomManifest.id,
    universe: options.universeManifest?.universe_id || null,
    runtimeHealth: loadedRuntime.health
  });
  receipts.push(hydrationReceipt);

  if (options.forge?.registerRuntimePackage) await options.forge.registerRuntimePackage(options.runtimePackage);
  if (options.forge?.registerRoom) await options.forge.registerRoom(options.roomManifest);
  if (options.forge?.registerRouter) await options.forge.registerRouter('steelcraft-room', router as unknown as Record<string, unknown>);
  if (options.forge?.emitReceipt) await options.forge.emitReceipt(hydrationReceipt);

  return {
    ok: loadedRuntime.health.ok,
    roomId: 'steelcraft-room',
    loadedRuntime,
    router,
    receipts
  };
}

export async function hydrateCommandCenter(options: BootstrapOptions) {
  const bootstrap = await bootstrapSteelCraftRuntime(options);
  const receipt = makeReceipt('universe_hydrated', {
    universe: options.universeManifest?.universe_id || 'steelcraft-command-center',
    postLoginRoute: '/command-center',
    sections: ['crm', 'estimating', 'projects', 'accounting', 'erection', 'billing', 'documents', 'profile']
  });

  if (options.forge?.emitReceipt) await options.forge.emitReceipt(receipt);
  bootstrap.receipts.push(receipt);

  return bootstrap;
}
