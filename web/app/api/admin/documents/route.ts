import { requirePermission } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";

export async function POST(request:Request){
  const body=await request.json() as {title?:string;type?:string;unitId?:string;year?:number;visibility?:string;url?:string};
  if(!body.title?.trim()||!body.type||!body.unitId||!body.year)return Response.json({error:"Data dokumen belum lengkap."},{status:400});
  const access=await requirePermission("document.manage",body.unitId);if(access.error)return access.error;
  const visibility=body.visibility==="PUBLIK"?"PUBLIK":"INTERNAL";
  const db=await ensureDatabase();
  const result=await db.prepare("INSERT INTO documents(title,type,unit_id,year,visibility,url) VALUES (?,?,?,?,?,?)").bind(body.title.trim(),body.type,body.unitId,body.year,visibility,body.url??"#").run();
  return Response.json({ok:true,id:result.meta.last_row_id},{status:201});
}
