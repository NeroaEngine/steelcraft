import type { MasterProjectRecord } from '../contracts/project-contract';

type QuoteRuntimeRecord = MasterProjectRecord & {
  recordType: 'quote' | 'project';
  quoteNumber: string;
};

const fallbackProject: QuoteRuntimeRecord = {
  id: 'demo-quote-1',
  recordType: 'quote',
  quoteNumber: 'Q-2026-0001',
  projectNumber: '',
  name: 'Example Quote Record',
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

export async function loadProjectRecord(projectId?: string): Promise<QuoteRuntimeRecord> {
  if (!projectId || projectId === fallbackProject.id || projectId === fallbackProject.quoteNumber) {
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

export function getFallbackProjectRecord(): QuoteRuntimeRecord {
  return fallbackProject;
}
