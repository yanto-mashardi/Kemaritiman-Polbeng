import { requireRoles } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";

export async function PATCH(request: Request) {
  const access = await requireRoles(["ADMIN", "KAJUR"]);
  if (access.error) return access.error;
  const body = await request.json() as { id?: number; target?: number };
  if (!body.id || !Number.isFinite(body.target)) return Response.json({ error: "Data KPI tidak valid." }, { status: 400 });
  const db = await ensureDatabase();
  await db.prepare("UPDATE kpis SET target = ? WHERE id = ?").bind(body.target, body.id).run();
  return Response.json({ ok: true, updatedBy: access.user.email });
}

export async function POST(request:Request){
  const access=await requireRoles(["ADMIN"]);if(access.error)return access.error;
  const body=await request.json() as {code?:string;name?:string;category?:string;unitId?:string;target?:number;year?:number;source?:string;formulaType?:string};
  const formulas=["AVERAGE_OBE","RATIO_GRADUATION","RATIO_TRACER","RATIO_LAB"];
  if(!body.code||!body.name||!body.formulaType||!formulas.includes(body.formulaType))return Response.json({error:"Definisi KPI belum lengkap."},{status:400});
  const db=await ensureDatabase();const result=await db.prepare("INSERT INTO kpis(code,name,category,unit_id,target,actual,year,source,formula_type,active) VALUES (?,?,?,?,?,0,?,?,?,1)").bind(body.code,body.name,body.category||"Umum",body.unitId||"UPPS",body.target||0,body.year||new Date().getFullYear(),body.source||"Excel",body.formulaType).run();
  return Response.json({ok:true,id:result.meta.last_row_id},{status:201});
}

export async function DELETE(request:Request){const access=await requireRoles(["ADMIN"]);if(access.error)return access.error;const id=Number(new URL(request.url).searchParams.get("id"));if(!id)return Response.json({error:"ID KPI tidak valid."},{status:400});const db=await ensureDatabase();await db.prepare("UPDATE kpis SET active=0 WHERE id=?").bind(id).run();return Response.json({ok:true})}
