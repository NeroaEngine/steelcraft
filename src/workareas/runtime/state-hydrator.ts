import type { CardRuntimeState } from '../contracts/card-contract';
import type { MasterProjectRecord } from '../contracts/project-contract';
import type { WorkAreaId } from '../contracts/workarea-contract';
import { getCardsForWorkArea } from '../registry/card-registry';

export type ProjectRuntimeState = {
  project: MasterProjectRecord;
  workAreaId: WorkAreaId;
  cards: CardRuntimeState[];
  hydratedAt: string;
  errors: string[];
};

export async function hydrateWorkAreaState(project: MasterProjectRecord, workAreaId: WorkAreaId): Promise<ProjectRuntimeState> {
  const cards = getCardsForWorkArea(workAreaId).map((card) => ({
    ...card,
    status: card.status || 'ready',
    data: {
      projectId: project.id,
      projectNumber: project.projectNumber,
      sqlTable: card.sqlTable,
      hydrated: false,
      source: 'registry',
    },
    errors: [],
  } satisfies CardRuntimeState));

  return {
    project,
    workAreaId,
    cards,
    hydratedAt: new Date().toISOString(),
    errors: [],
  };
}
