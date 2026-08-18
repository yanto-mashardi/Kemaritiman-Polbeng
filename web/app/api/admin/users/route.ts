import { requireRoles } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";

export async function GET() {
  const access = await requireRoles(["ADMIN", "KAJUR"]); if (access.error) return access.error;
  const db = await ensureDatabase(); const rows = await db.prepare("SELECT id,email,name,role,unit_id AS unitId,active FROM users ORDER BY role,name").all();
  return Response.json({ users: rows.results });
}

export async function POST(request: Request) {
  const access = await requireRoles(["ADMIN"]); if (access.error) return access.error;
  const body = await request.json() as { email?: string; name?: string; role?: string; unitId?: string };
  const roles = ["ADMIN","KAJUR","SEKJUR","KAPRODI","GKM","VIEWER"];
  if (!body.email?.includes("@") || !body.name?.trim() || !body.role || !roles.includes(body.role) || !body.unitId) return Response.json({ error: "Data pengguna tidak valid." }, { status: 400 });
  const db = await ensureDatabase();
  await db.prepare("INSERT INTO users(email,name,role,unit_id,active) VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE name=VALUES(name),role=VALUES(role),unit_id=VALUES(unit_id),active=1").bind(body.email.toLowerCase(),body.name.trim(),body.role,body.unitId).run();
  return Response.json({ ok: true }, { status: 201 });
}
