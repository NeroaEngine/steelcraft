import type { ProjectActivityEvent } from '../contracts/project-contract';
import type { ProjectRuntimeState } from './state-hydrator';

export type ProjectTimeline = {
  projectId: string;
  projectNumber: string;
  events: ProjectActivityEvent[];
  updatedAt: string;
};

export function createTimelineFromRuntime(state: ProjectRuntimeState, events: ProjectActivityEvent[] = []): ProjectTimeline {
  return {
    projectId: state.project.id,
    projectNumber: state.project.projectNumber,
    events: [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    updatedAt: new Date().toISOString(),
  };
}

export function appendTimelineEvent(timeline: ProjectTimeline, event: ProjectActivityEvent): ProjectTimeline {
  return {
    ...timeline,
    events: [event, ...timeline.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    updatedAt: new Date().toISOString(),
  };
}

export function eventsForProject(events: ProjectActivityEvent[], projectId: string): ProjectActivityEvent[] {
  return events.filter((event) => event.projectId === projectId);
}
