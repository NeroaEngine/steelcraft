import type { WorkAreaId, WorkAreaManifest } from '../contracts/workarea-contract';
import type { MasterProjectRecord } from '../contracts/project-contract';
import { loadWorkAreaManifest } from '../registry/manifest-loader';
import { loadProjectRecord } from '../registry/project-loader';
import { hydrateWorkAreaState, type ProjectRuntimeState } from './state-hydrator';

export type WorkspaceRuntime = {
  manifest: WorkAreaManifest;
  project: MasterProjectRecord;
  state: ProjectRuntimeState;
};

export async function loadWorkspaceRuntime(workAreaId: WorkAreaId = 'command-center', projectId?: string): Promise<WorkspaceRuntime> {
  const manifest = loadWorkAreaManifest(workAreaId);
  const project = await loadProjectRecord(projectId);
  const state = await hydrateWorkAreaState(project, workAreaId);

  return {
    manifest,
    project,
    state,
  };
}

export async function reloadWorkspaceRuntime(current: WorkspaceRuntime): Promise<WorkspaceRuntime> {
  return loadWorkspaceRuntime(current.manifest.id, current.project.projectNumber || current.project.id);
}
