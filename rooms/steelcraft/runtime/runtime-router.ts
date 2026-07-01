import { executeSteelCraftAction, type SteelCraftActionPacket, type SteelCraftReceipt } from '../steelcraft.worker';

export type RuntimeRoute = {
  id: string;
  action: string;
  target: 'worker' | 'workflow' | 'entity' | 'import' | 'receipt';
  description?: string;
};

export type RuntimeRouterOptions = {
  routes?: RuntimeRoute[];
};

const defaultRoutes: RuntimeRoute[] = [
  { id: 'generate-model', action: 'steelcraft.model.generate', target: 'worker', description: 'Generate a structured metal building model and quantity takeoff.' },
  { id: 'quote-to-project', action: 'steelcraft.workflow.quoteToProject', target: 'worker', description: 'Return the quote-to-project workflow spine.' },
  { id: 'estimate-consume-model', action: 'steelcraft.estimate.consumeModel', target: 'workflow', description: 'Attach generated model quantities to an estimate.' },
  { id: 'mbs-prepare-export', action: 'steelcraft.mbs.prepareExport', target: 'workflow', description: 'Prepare model and component data for future MBS export.' },
  { id: 'entity-link', action: 'steelcraft.entity.link', target: 'entity', description: 'Link imported records to the Project Information spine.' },
  { id: 'import-execute', action: 'steelcraft.import.execute', target: 'import', description: 'Execute an import registry mapping.' }
];

function unsupportedReceipt(packet: SteelCraftActionPacket): SteelCraftReceipt {
  return {
    ok: false,
    room: 'steelcraft-room',
    action: packet.action,
    generatedAt: new Date().toISOString(),
    source: 'runtime-router.ts',
    error: `No Steel Craft runtime route registered for action: ${packet.action}`
  };
}

export function createSteelCraftRuntimeRouter(options: RuntimeRouterOptions = {}) {
  const routes = [...defaultRoutes, ...(options.routes || [])];

  return {
    routes,
    hasRoute(action: string) {
      return routes.some((route) => route.action === action);
    },
    routeFor(action: string) {
      return routes.find((route) => route.action === action) || null;
    },
    async dispatch(packet: SteelCraftActionPacket): Promise<SteelCraftReceipt> {
      const route = routes.find((item) => item.action === packet.action);
      if (!route) return unsupportedReceipt(packet);

      if (route.target === 'worker') return executeSteelCraftAction(packet);

      return {
        ok: true,
        room: 'steelcraft-room',
        action: packet.action,
        generatedAt: new Date().toISOString(),
        source: 'runtime-router.ts',
        result: {
          routed: true,
          target: route.target,
          routeId: route.id,
          note: 'Route is registered. Service implementation will execute this target in the next runtime layer.'
        }
      };
    }
  };
}
