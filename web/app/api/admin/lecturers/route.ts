import * as XLSX from "xlsx";
import { requirePermission } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";

type Row=Record<string,string|number|undefined>;
export async function POST(request:Request){
  const form=await request.formData(),file=form.get("file"),requestedUnit=String(form.get("unitId")||"");
  const access=await requirePermission("lecturer.manage",requestedUnit||undefined);if(access.error)return access.error;
  const user=access.user;
  if(!(file instanceof File)||!file.name.match(/\.xlsx?$/i))return Response.json({error:"Gunakan file Excel."},{status:400});
  const bytes=new Uint8Array(await file.arrayBuffer()),workbook=XLSX.read(bytes,{type:"array"}),rows=XLSX.utils.sheet_to_json<Row>(workbook.Sheets[workbook.SheetNames[0]],{defval:""});
  const db=await ensureDatabase();let saved=0;
  for(const row of rows){const nidn=String(row.NIDN||"").trim(),name=String(row.NAMA||"").trim(),program=user.role==="KAPRODI"?user.unitId:String(row.PRODI||requestedUnit||"").toUpperCase();if(!nidn||!name||!["NAUTIKA","KPN"].includes(program))continue;if(user.role==="KAPRODI"&&program!==user.unitId)continue;const scholarId=String(row.SCHOLAR_ID||"").trim();await db.prepare("INSERT INTO lecturers(nidn,name,program_id,email,expertise,scholar_id,scholar_url,active) VALUES (?,?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE name=VALUES(name),program_id=VALUES(program_id),email=VALUES(email),expertise=VALUES(expertise),scholar_id=VALUES(scholar_id),scholar_url=VALUES(scholar_url),active=1").bind(nidn,name,program,String(row.EMAIL||""),String(row.BIDANG_KEAHLIAN||""),scholarId,scholarId?`https://scholar.google.com/citations?user=${encodeURIComponent(scholarId)}`:"").run();saved++}
  return Response.json({ok:true,saved,message:`${saved} profil dosen diperbarui.`});
}
