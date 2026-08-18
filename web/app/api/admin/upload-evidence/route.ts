import * as XLSX from "xlsx";
import { currentPortalUser } from "../../../lib/authorization";
import { ensureDatabase, refreshDerivedKpis } from "../../../lib/mysql-database";

type Row=Record<string,string|number|boolean|undefined>;
const number=(value:unknown)=>Number(String(value??0).replace(",","."));
export async function POST(request:Request){
  const user=await currentPortalUser();
  if(!user.email)return Response.json({error:"Silakan login."},{status:401});
  const data=await request.formData(),file=data.get("file"),instrument=String(data.get("instrument")||""),requestedUnit=String(data.get("unitId")||""),year=Number(data.get("year")||new Date().getFullYear());
  if(!(file instanceof File)||!file.name.match(/\.xlsx?$/i))return Response.json({error:"Unggah berkas Excel .xlsx atau .xls."},{status:400});
  if(file.size>10*1024*1024)return Response.json({error:"Ukuran berkas maksimal 10 MB."},{status:400});
  const program=user.role==="KAPRODI"?user.unitId:requestedUnit;
  const programAllowed=user.role==="ADMIN"||user.role==="KAPRODI";
  const labAllowed=user.role==="ADMIN"||user.role==="SEKJUR";
  if((instrument==="LAB"&&!labAllowed)||(instrument!=="LAB"&&!programAllowed))return Response.json({error:"Role tidak berwenang mengunggah instrumen ini."},{status:403});
  const bytes=new Uint8Array(await file.arrayBuffer()),checksum=[...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(x=>x.toString(16).padStart(2,"0")).join("");
  const workbook=XLSX.read(bytes,{type:"array"}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json<Row>(sheet,{defval:""});
  if(!rows.length)return Response.json({error:"Excel tidak berisi baris data."},{status:400});
  const db=await ensureDatabase();
  const saved=await db.prepare("INSERT INTO evidence_uploads(file_name,mime_type,file_size,file_data,instrument_type,unit_id,year,uploaded_by,row_count,checksum,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(file.name,file.type||"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",file.size,Buffer.from(bytes),instrument,program||"UPPS",year,user.email,rows.length,checksum,Date.now()).run();
  const uploadId=saved.meta.last_row_id;
  if(instrument==="TRACER"){
    const traced=rows.filter(r=>String(r.NIM||"").trim()).length,employed=rows.filter(r=>String(r.STATUS_PEKERJAAN||"").toUpperCase().match(/BEKERJA|WIRAUSAHA/)&&number(r.BULAN_TUNGGU)<=6).length;
    await db.prepare("INSERT INTO tracer_records(year,program_id,traced,employed_within_6_months,upload_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE traced=VALUES(traced),employed_within_6_months=VALUES(employed_within_6_months),upload_id=VALUES(upload_id)").bind(year,program,traced,employed,uploadId).run();
  }else if(instrument==="ACADEMIC"){
    const graduated=rows.filter(r=>String(r.NIM||"").trim()).length,onTime=rows.filter(r=>["YA","Y","1","TRUE"].includes(String(r.TEPAT_WAKTU).toUpperCase())).length;
    await db.prepare("INSERT INTO academic_records(year,program_id,graduated,graduated_on_time,upload_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE graduated=VALUES(graduated),graduated_on_time=VALUES(graduated_on_time),upload_id=VALUES(upload_id)").bind(year,program,graduated,onTime,uploadId).run();
  }else if(instrument==="OBE"){
    for(const row of rows)if(row.KODE_CPL&&Number.isFinite(number(row.NILAI)))await db.prepare("INSERT INTO outcome_results(program_id,code,name,score,semester,target,upload_id) VALUES (?,?,?,?,?,80,?)").bind(program,String(row.KODE_CPL),String(row.NAMA_CPL||row.KODE_CPL),number(row.NILAI),String(row.SEMESTER||""),uploadId).run();
  }else if(instrument==="LAB"){
    for(const row of rows)if(number(row.LAB_ID))await db.prepare("INSERT INTO laboratory_usage(year,laboratory_id,available_hours,used_hours,upload_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE available_hours=VALUES(available_hours),used_hours=VALUES(used_hours),upload_id=VALUES(upload_id)").bind(year,number(row.LAB_ID),number(row.JAM_TERSEDIA),number(row.JAM_DIGUNAKAN),uploadId).run();
  }else return Response.json({error:"Jenis instrumen tidak dikenal."},{status:400});
  await refreshDerivedKpis(db);await db.prepare("INSERT INTO audit_logs(user_email,role,action,entity,entity_id,created_at) VALUES (?,?,?,?,?,?)").bind(user.email,user.role,"UPLOAD_EXCEL",instrument,String(uploadId),Date.now()).run();
  return Response.json({ok:true,uploadId,rowCount:rows.length,message:`${rows.length} baris diproses. KPI telah dihitung ulang.`});
}
