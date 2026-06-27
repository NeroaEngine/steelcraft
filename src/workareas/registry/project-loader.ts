import type { MasterProjectRecord } from '../contracts/project-contract';

const fallbackProject: MasterProjectRecord = {
  id: 'demo-project-1',
  projectNumber: 'SCB-2026-0001',
  name: 'Example Project Record',
  stage: 'estimating',
  customerId: 'acme-corp',
  accountId: 'acme-corp',
  estimator: 'Seth McBride',
  salesperson: 'Seth McBride',
  projectManager: '',
  manufacturerJobNumber: '',
  customerPoNumber: '',
  contractNumber: '',
};

export async function loadProjectRecord(projectId?: string): Promise<MasterProjectRecord> {
  if (!projectId || projectId === fallbackProject.id || projectId === fallbackProject.projectNumber) {
    return fallbackProject;
  }

  try {
    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) return fallbackProject;
    return await response.json();
  } catch {
    return fallbackProject;
  }
}

export function getFallbackProjectRecord(): MasterProjectRecord {
  return fallbackProject;
}
