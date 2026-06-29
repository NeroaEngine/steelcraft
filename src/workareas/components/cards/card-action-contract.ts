export type PromptPacket = {
  id: string;
  prompt: string;
  source: 'voice' | 'chat' | 'card' | 'system';
  targetCardId?: string;
  quoteId?: string;
  projectId?: string;
  userId?: string;
  createdAt: string;
};

export type RuntimeContext = {
  quoteId?: string;
  projectId?: string;
  userId?: string;
  tenantId?: string;
  role?: string;
};

export type CardReceipt = {
  id: string;
  cardId: string;
  status: 'accepted' | 'executed' | 'cancelled' | 'failed';
  message: string;
  createdAt: string;
  payload?: unknown;
};

export type CardResult = {
  ok: boolean;
  cardId: string;
  projection?: unknown;
  receipt: CardReceipt;
  errors?: string[];
};

export type SteelCraftCardExecutor = {
  cardId: string;
  title: string;
  acceptPrompt: (packet: PromptPacket) => Promise<CardReceipt>;
  execute: (context: RuntimeContext) => Promise<CardResult>;
  cancel: () => Promise<CardReceipt>;
  returnReceipt: () => Promise<CardReceipt | null>;
};

export function buildCardReceipt(cardId: string, status: CardReceipt['status'], message: string, payload?: unknown): CardReceipt {
  return {
    id: `${cardId}-${Date.now()}`,
    cardId,
    status,
    message,
    createdAt: new Date().toISOString(),
    payload,
  };
}
