import { ensureDatabase } from "../../lib/mysql-database";
import { requirePermission } from "../../lib/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access=await requirePermission("workspace.read");
    if(access.error)return access.error;
    const db = await ensureDatabase();
    const scoped=access.user.role==="KAPRODI";
    const unit=access.user.unitId;
    const [kpis, documents, outcomes, repositories, laboratories, lecturers, workflows] = await Promise.all([
      db.prepare(scoped?"SELECT id,code,name,category AS unit,target,actual,year,source,formula_type AS formulaType FROM kpis WHERE active=1 AND unit_id IN (?, 'UPPS') ORDER BY code":"SELECT id,code,name,category AS unit,target,actual,year,source,formula_type AS formulaType FROM kpis WHERE active=1 ORDER BY code").bind(...(scoped?[unit]:[])).all(),
      db.prepare(scoped?"SELECT id,title,type,unit_id AS unitId,year,visibility,url FROM documents WHERE unit_id=? ORDER BY year DESC,id DESC":"SELECT id,title,type,unit_id AS unitId,year,visibility,url FROM documents ORDER BY year DESC,id DESC").bind(...(scoped?[unit]:[])).all(),
      db.prepare(scoped?"SELECT id,program_id AS programId,code,name,score,semester,target FROM outcome_results WHERE program_id=? ORDER BY code":"SELECT id,program_id AS programId,code,name,score,semester,target FROM outcome_results ORDER BY program_id,code").bind(...(scoped?[unit]:[])).all(),
      db.prepare(scoped?"SELECT id,title,author,year,type,program_id AS programId,url FROM repositories WHERE program_id=? ORDER BY year DESC,id DESC":"SELECT id,title,author,year,type,program_id AS programId,url FROM repositories ORDER BY year DESC,id DESC").bind(...(scoped?[unit]:[])).all(),
      db.prepare("SELECT id,name,field,equipment_count AS equipmentCount,member_count AS memberCount,roadmap_progress AS roadmapProgress FROM laboratories ORDER BY id").all(),
      db.prepare(scoped?"SELECT id,nidn,name,program_id AS programId,email,expertise,scholar_id AS scholarId,scholar_url AS scholarUrl,photo_url AS photoUrl FROM lecturers WHERE active=1 AND program_id=? ORDER BY name":"SELECT id,nidn,name,program_id AS programId,email,expertise,scholar_id AS scholarId,scholar_url AS scholarUrl,photo_url AS photoUrl FROM lecturers WHERE active=1 ORDER BY name").bind(...(scoped?[unit]:[])).all(),
      db.prepare(scoped?"SELECT * FROM workflow_items WHERE unit_id=? ORDER BY updated_at DESC":"SELECT * FROM workflow_items ORDER BY updated_at DESC").bind(...(scoped?[unit]:[])).all(),
    ]);
    return Response.json({ kpis:kpis.results,documents:documents.results,outcomes:outcomes.results,repositories:repositories.results,laboratories:laboratories.results,lecturers:lecturers.results,workflows:workflows.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Database gagal dibaca." }, { status: 500 });
  }
}
