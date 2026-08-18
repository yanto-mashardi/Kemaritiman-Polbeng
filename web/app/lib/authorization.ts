import { headers } from "next/headers";
import { ensureDatabase } from "./mysql-database";
import { hashToken } from "./password";

export type PortalRole = "ADMIN" | "KAJUR" | "SEKJUR" | "KAPRODI" | "GKM" | "VIEWER";
export type PortalUser = { email: string; name: string; role: PortalRole; unitId: string; demo?: boolean };

export async function currentPortalUser(): Promise<PortalUser> {
  const requestHeaders = await headers();
  const platformEmail = requestHeaders.get("oai-authenticated-user-email")?.toLowerCase();
  const sessionToken = requestHeaders.get("cookie")?.match(/(?:^|;\s*)kemaritiman_session=([^;]+)/)?.[1];
  if (!platformEmail && !sessionToken) return { email: "", name: "Pengunjung", role: "VIEWER", unitId: "PUBLIK" };

  const db = await ensureDatabase();
  if (sessionToken) {
    const tokenHash = await hashToken(decodeURIComponent(sessionToken));
    const row = await db.prepare("SELECT u.email,u.name,u.role,u.unit_id AS unitId FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1").bind(tokenHash, Date.now()).first<PortalUser>();
    if (row) return row;
  }
  if (!platformEmail) return { email: "", name: "Pengunjung", role: "VIEWER", unitId: "PUBLIK" };
  const row = await db.prepare("SELECT email,name,role,unit_id AS unitId FROM users WHERE email = ? AND active = 1").bind(platformEmail).first<PortalUser>();
  return row ?? { email: platformEmail, name: platformEmail, role: "VIEWER", unitId: "PUBLIK" };
}

export async function requireRoles(roles: PortalRole[]) {
  const user = await currentPortalUser();
  if (!roles.includes(user.role)) return { user, error: Response.json({ error: "Anda tidak memiliki hak akses untuk tindakan ini." }, { status: 403 }) };
  return { user, error: null };
}
