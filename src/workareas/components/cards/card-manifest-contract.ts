export type CardSize = 'small' | 'medium' | 'large' | 'wide' | 'full';
export type CardPriority = 'primary' | 'secondary' | 'supporting';
export type CardCapability = 'prompt' | 'execute' | 'receipt' | 'inspect' | 'project' | 'quote' | 'document' | 'takeoff' | 'billing';

export type CardFieldManifest = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'select' | 'textarea' | 'computed' | 'checkbox';
  editable: boolean;
  required?: boolean;
  options?: string[];
  source?: string;
};

export type CanvasCardManifest = {
  id: string;
  title: string;
  roomId: string;
  description: string;
  size: CardSize;
  priority: CardPriority;
  capabilities: CardCapability[];
  fields: CardFieldManifest[];
  actions: string[];
  outputs: string[];
};
