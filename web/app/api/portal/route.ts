import { ensureDatabase } from "../../lib/mysql-database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await ensureDatabase();
    const [kpis, documents, outcomes, repositories, laboratories, lecturers] = await Promise.all([
      db.prepare("SELECT id,code,name,category AS unit,target,actual,year,source,formula_type AS formulaType FROM kpis WHERE active=1 ORDER BY code").all(),
      db.prepare("SELECT id,title,type,unit_id AS unitId,year,visibility,url FROM documents ORDER BY year DESC,id DESC").all(),
      db.prepare("SELECT id,program_id AS programId,code,name,score,semester,target FROM outcome_results ORDER BY program_id,code").all(),
      db.prepare("SELECT id,title,author,year,type,program_id AS programId,url FROM repositories ORDER BY year DESC,id DESC").all(),
      db.prepare("SELECT id,name,field,equipment_count AS equipmentCount,member_count AS memberCount,roadmap_progress AS roadmapProgress FROM laboratories ORDER BY id").all(),
      db.prepare("SELECT id,nidn,name,program_id AS programId,email,expertise,scholar_id AS scholarId,scholar_url AS scholarUrl,photo_url AS photoUrl FROM lecturers WHERE active=1 ORDER BY name").all(),
    ]);
    return Response.json({ kpis: kpis.results, documents: documents.results, outcomes: outcomes.results, repositories: repositories.results, laboratories: laboratories.results, lecturers: lecturers.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Database gagal dibaca." }, { status: 500 });
  }
}
