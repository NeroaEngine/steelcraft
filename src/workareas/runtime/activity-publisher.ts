import type { ProjectActivityEvent } from '../contracts/project-contract';

export type PublishActivityInput = {
  projectId: string;
  type: string;
  title: string;
  body?: string;
  userId?: string;
  receiptId?: string;
};

export function buildActivityEvent(input: PublishActivityInput): ProjectActivityEvent {
  return {
    id: `activity-${Date.now()}`,
    projectId: input.projectId,
    type: input.type,
    title: input.title,
    body: input.body || '',
    userId: input.userId,
    createdAt: new Date().toISOString(),
    receiptId: input.receiptId,
  };
}

export async function publishActivity(input: PublishActivityInput): Promise<ProjectActivityEvent> {
  const event = buildActivityEvent(input);
  return event;
}
