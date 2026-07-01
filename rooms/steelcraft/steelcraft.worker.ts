export type SteelCraftActionPacket = {
  action: string;
  payload?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

export type SteelCraftReceipt = {
  ok: boolean;
  room: string;
  action: string;
  generatedAt: string;
  source: string;
  result?: Record<string, unknown>;
  error?: string;
};

const roomId = 'steelcraft-room';

function receipt(action: string, result: Record<string, unknown> = {}): SteelCraftReceipt {
  return {
    ok: true,
    room: roomId,
    action,
    generatedAt: new Date().toISOString(),
    source: 'steelcraft.worker.ts',
    result
  };
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function generateMetalBuildingModel(payload: Record<string, unknown> = {}) {
  const length = normalizeNumber(payload.length, 100);
  const width = normalizeNumber(payload.width, 60);
  const eaveHeight = normalizeNumber(payload.eaveHeight, 16);
  const roofPitch = normalizeNumber(payload.roofPitch, 1);
  const baySpacing = normalizeNumber(payload.baySpacing, 25) || 25;
  const bayCount = Math.max(1, Math.ceil(length / baySpacing));
  const wallArea = Math.round((length * eaveHeight * 2) + (width * eaveHeight * 2));
  const roofArea = Math.round(length * width * (1 + roofPitch / 12));
  const floorArea = Math.round(length * width);

  const doors = Array.isArray(payload.doors) ? payload.doors : [];
  const windows = Array.isArray(payload.windows) ? payload.windows : [];

  return {
    modelType: 'manual-metal-building-shell-v0',
    dimensions: { length, width, eaveHeight, roofPitch, baySpacing, bayCount },
    quantities: {
      floorArea,
      wallArea,
      roofArea,
      frameLines: bayCount + 1,
      doors: doors.length,
      windows: windows.length
    },
    components: [
      { type: 'primary_frame', quantity: bayCount + 1, unit: 'ea' },
      { type: 'roof_panel_area', quantity: roofArea, unit: 'sf' },
      { type: 'wall_panel_area', quantity: wallArea, unit: 'sf' },
      { type: 'trim_allowance', quantity: Math.round((length + width) * 2), unit: 'lf' },
      { type: 'door_openings', quantity: doors.length, unit: 'ea' },
      { type: 'window_openings', quantity: windows.length, unit: 'ea' }
    ],
    viewer: {
      projection: 'isometric-placeholder',
      note: 'Initial generator creates a structured model and quantity takeoff. Three-dimensional rendering can consume this object.'
    }
  };
}

export async function executeSteelCraftAction(packet: SteelCraftActionPacket): Promise<SteelCraftReceipt> {
  try {
    if (packet.action === 'steelcraft.model.generate') {
      return receipt(packet.action, generateMetalBuildingModel(packet.payload || {}));
    }
    if (packet.action === 'steelcraft.workflow.quoteToProject') {
      return receipt(packet.action, {
        spine: ['project-information', 'working-sheet', 'estimate', 'metal-building-generator', 'quotation', 'delivery', 'erection', 'sov', 'invoice'],
        status: 'ready'
      });
    }
    return receipt(packet.action, { status: 'accepted', note: 'Steel Craft action registered for card runtime handling.' });
  } catch (error) {
    return {
      ok: false,
      room: roomId,
      action: packet.action,
      generatedAt: new Date().toISOString(),
      source: 'steelcraft.worker.ts',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
