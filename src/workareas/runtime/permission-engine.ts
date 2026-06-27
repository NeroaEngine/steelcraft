import type { WorkAreaId, WorkAreaManifest } from '../contracts/workarea-contract';
import type { SteelCraftCard } from '../contracts/card-contract';

export type SteelCraftRole =
  | 'admin'
  | 'owner'
  | 'sales'
  | 'estimator'
  | 'project-manager'
  | 'comptroller'
  | 'superintendent'
  | 'vendor'
  | 'customer';

export type PermissionDecision = {
  allowed: boolean;
  reason: string;
};

const defaultWorkAreaRoles: Record<WorkAreaId, SteelCraftRole[]> = {
  'command-center': ['admin', 'owner', 'sales', 'estimator', 'project-manager', 'comptroller', 'superintendent'],
  'crm-sales': ['admin', 'owner', 'sales', 'estimator'],
  estimating: ['admin', 'owner', 'sales', 'estimator'],
  proposal: ['admin', 'owner', 'sales', 'estimator'],
  contract: ['admin', 'owner', 'sales', 'project-manager', 'comptroller'],
  'schedule-of-values': ['admin', 'owner', 'project-manager', 'comptroller'],
  'billing-insurance': ['admin', 'owner', 'project-manager', 'comptroller'],
  'project-delivery': ['admin', 'owner', 'project-manager', 'superintendent'],
  erection: ['admin', 'owner', 'project-manager', 'superintendent'],
  'vendor-portal': ['admin', 'owner', 'project-manager', 'comptroller', 'vendor'],
  'customer-portal': ['admin', 'owner', 'project-manager', 'comptroller', 'customer'],
  documents: ['admin', 'owner', 'sales', 'estimator', 'project-manager', 'comptroller', 'superintendent', 'vendor', 'customer'],
  'change-orders': ['admin', 'owner', 'sales', 'estimator', 'project-manager', 'comptroller'],
  'activity-timeline': ['admin', 'owner', 'sales', 'estimator', 'project-manager', 'comptroller', 'superintendent'],
  'import-center': ['admin', 'owner'],
};

export function canAccessWorkArea(role: SteelCraftRole, manifest: WorkAreaManifest): PermissionDecision {
  if (role === 'admin' || role === 'owner') return { allowed: true, reason: 'Admin or owner access.' };

  const allowedRoles = manifest.allowedRoles?.length
    ? (manifest.allowedRoles as SteelCraftRole[])
    : defaultWorkAreaRoles[manifest.id];

  if (allowedRoles.includes(role)) return { allowed: true, reason: `Role ${role} can access ${manifest.id}.` };

  return { allowed: false, reason: `Role ${role} cannot access ${manifest.id}.` };
}

export function canAccessCard(role: SteelCraftRole, card: SteelCraftCard): PermissionDecision {
  if (role === 'admin' || role === 'owner') return { allowed: true, reason: 'Admin or owner access.' };
  if (card.protected && role !== 'admin') return { allowed: false, reason: `Card ${card.id} is protected.` };
  return { allowed: true, reason: `Role ${role} can view card ${card.id}.` };
}
