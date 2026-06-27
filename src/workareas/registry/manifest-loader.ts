import type { WorkAreaId, WorkAreaManifest } from '../contracts/workarea-contract';
import { getWorkArea, getWorkAreas } from './workarea-registry';

export function loadWorkAreaManifest(workAreaId: WorkAreaId): WorkAreaManifest {
  const manifest = getWorkArea(workAreaId);
  if (!manifest) {
    throw new Error(`Unknown Steel Craft work area: ${workAreaId}`);
  }
  return manifest;
}

export function loadAllWorkAreaManifests(): WorkAreaManifest[] {
  return getWorkAreas();
}

export function assertWorkAreaIsEditable(workAreaId: WorkAreaId): void {
  const manifest = loadWorkAreaManifest(workAreaId);
  if (manifest.protected) {
    throw new Error(`Protected Steel Craft work area cannot be modified by shell operations: ${workAreaId}`);
  }
}
