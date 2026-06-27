export type RoomStatus = 'idle' | 'loading' | 'active' | 'suspended' | 'error';

export type RoomManifest = {
  id: string;
  title: string;
  description?: string;
  cards: string[];
  requiredTables?: string[];
  requiredWorkers?: string[];
  allowedRoles?: string[];
};

export type RoomContext = {
  roomId: string;
  projectId?: string;
  userId?: string;
  role?: string;
};

export type RoomRuntimeState = {
  status: RoomStatus;
  manifest?: RoomManifest;
  cards: unknown[];
  errors: string[];
};
