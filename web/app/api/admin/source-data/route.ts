import { currentPortalUser } from "../../../lib/authorization";
import { ensureDatabase, refreshDerivedKpis } from "../../../lib/mysql-database";

type SourceBody = { type?: "OBE"|"ACADEMIC"|"TRACER"|"LAB"; programId?: string; year?: number; code?: string; name?: string; score?: number; semester?: string; graduated?: number; graduatedOnTime?: number; traced?: number; employed?: number; laboratoryId?: number; availableHours?: number; usedHours?: number };

export async function POST(request: Request) {
  const user = await currentPortalUser();
  const body = await request.json() as SourceBody;
  if (!body.type || !user.email) return Response.json({ error: "Data atau sesi tidak valid." }, { status: 400 });
  const allAccess = user.role === "ADMIN";
  const programAccess = allAccess || user.role === "KAPRODI";
  const labAccess = allAccess || user.role === "SEKJUR";
  const program = user.role === "KAPRODI" ? user.unitId : body.programId;
  const db = await ensureDatabase();

  if (body.type === "OBE" && programAccess && program && body.code && body.name && Number.isFinite(body.score)) {
    await db.prepare("INSERT INTO outcome_results(program_id,code,name,score,semester,target) VALUES (?,?,?,?,?,80)").bind(program,body.code,body.name,body.score,body.semester||"2025/2026 Genap").run();
  } else if (body.type === "ACADEMIC" && programAccess && program && Number.isFinite(body.graduated) && Number.isFinite(body.graduatedOnTime)) {
    await db.prepare("INSERT INTO academic_records(year,program_id,graduated,graduated_on_time) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE graduated=VALUES(graduated),graduated_on_time=VALUES(graduated_on_time)").bind(body.year||2026,program,body.graduated,body.graduatedOnTime).run();
  } else if (body.type === "TRACER" && programAccess && program && Number.isFinite(body.traced) && Number.isFinite(body.employed)) {
    await db.prepare("INSERT INTO tracer_records(year,program_id,traced,employed_within_6_months) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE traced=VALUES(traced),employed_within_6_months=VALUES(employed_within_6_months)").bind(body.year||2026,program,body.traced,body.employed).run();
  } else if (body.type === "LAB" && labAccess && body.laboratoryId && Number.isFinite(body.availableHours) && Number.isFinite(body.usedHours)) {
    await db.prepare("INSERT INTO laboratory_usage(year,laboratory_id,available_hours,used_hours) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE available_hours=VALUES(available_hours),used_hours=VALUES(used_hours)").bind(body.year||2026,body.laboratoryId,body.availableHours,body.usedHours).run();
  } else return Response.json({ error: "Role tidak berwenang atau isian sumber data belum lengkap." }, { status: 403 });

  await db.prepare("INSERT INTO audit_logs(user_email,role,action,entity,entity_id,created_at) VALUES (?,?,?,?,?,?)").bind(user.email,user.role,"INPUT_SOURCE",body.type,program||String(body.laboratoryId||""),Date.now()).run();
  await refreshDerivedKpis(db);
  return Response.json({ ok: true, message: "Data sumber tersimpan dan realisasi KPI dihitung ulang." });
}
