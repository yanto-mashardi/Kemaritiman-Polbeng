import type { PortalRole } from "./authorization";

export type Permission =
  | "portal.public.read"
  | "workspace.read"
  | "kpi.target.manage"
  | "kpi.definition.manage"
  | "document.manage"
  | "evidence.program.upload"
  | "evidence.lab.upload"
  | "obe.manage"
  | "evaluation.manage"
  | "approval.manage"
  | "corrective_action.manage"
  | "user.manage";

const rolePermissions: Record<PortalRole, Permission[]> = {
  VIEWER: ["portal.public.read"],
  ADMIN: [
    "portal.public.read","workspace.read","kpi.target.manage","kpi.definition.manage","document.manage",
    "evidence.program.upload","evidence.lab.upload","obe.manage","evaluation.manage","approval.manage",
    "corrective_action.manage","user.manage",
  ],
  KAJUR: [
    "portal.public.read","workspace.read","kpi.target.manage","document.manage","evaluation.manage",
    "approval.manage","corrective_action.manage",
  ],
  SEKJUR: [
    "portal.public.read","workspace.read","document.manage","evidence.lab.upload","corrective_action.manage",
  ],
  KAPRODI: [
    "portal.public.read","workspace.read","document.manage","evidence.program.upload","obe.manage",
    "corrective_action.manage",
  ],
  GKM: [
    "portal.public.read","workspace.read","evaluation.manage",
  ],
};

export function hasPermission(role: PortalRole, permission: Permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: PortalRole) {
  return rolePermissions[role] ?? [];
}

export function canAccessUnit(role: PortalRole, userUnitId: string, requestedUnitId: string) {
  if (role === "ADMIN" || role === "KAJUR" || role === "GKM") return true;
  if (role === "SEKJUR") return requestedUnitId === "UPPS" || requestedUnitId === "LAB";
  if (role === "KAPRODI") return requestedUnitId === userUnitId;
  return requestedUnitId === "PUBLIK";
}
