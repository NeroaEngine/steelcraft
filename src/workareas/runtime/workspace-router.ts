import type { WorkAreaId } from '../contracts/workarea-contract';
import { loadWorkAreaManifest } from '../registry/manifest-loader';

export type WorkspaceRoute = {
  workAreaId: WorkAreaId;
  projectId?: string;
};

export function createWorkspaceRoute(workAreaId: WorkAreaId, projectId?: string): WorkspaceRoute {
  loadWorkAreaManifest(workAreaId);
  return { workAreaId, projectId };
}

export function serializeWorkspaceRoute(route: WorkspaceRoute): string {
  const params = new URLSearchParams();
  params.set('workArea', route.workAreaId);
  if (route.projectId) params.set('project', route.projectId);
  return `/app?${params.toString()}`;
}

export function parseWorkspaceRoute(search = window.location.search): WorkspaceRoute {
  const params = new URLSearchParams(search);
  const workAreaId = (params.get('workArea') || 'command-center') as WorkAreaId;
  const projectId = params.get('project') || undefined;
  loadWorkAreaManifest(workAreaId);
  return { workAreaId, projectId };
}
