export type SqlCardQuery = {
  table: string;
  select?: string[];
  where?: Record<string, string | number | boolean | null>;
  orderBy?: string;
  limit?: number;
};

export type SqlCardMutation = {
  table: string;
  values: Record<string, unknown>;
  where?: Record<string, string | number | boolean | null>;
};

export type SqlCardBinding = {
  cardId: string;
  projectScoped: boolean;
  primaryTable: string;
  read: SqlCardQuery;
  create?: SqlCardMutation;
  update?: SqlCardMutation;
};
