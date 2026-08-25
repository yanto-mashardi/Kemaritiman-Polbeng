import { requirePermission } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const db=await ensureDatabase();
  const file=await db.prepare("SELECT file_name AS fileName,mime_type AS mimeType,file_data AS fileData,unit_id AS unitId FROM evidence_uploads WHERE id=?").bind(id).first<{fileName:string;mimeType:string;fileData:Uint8Array;unitId:string}>();
  if(!file)return new Response("Not found",{status:404});
  const access=await requirePermission("workspace.read",file.unitId);if(access.error)return access.error;
  return new Response(file.fileData,{headers:{"Content-Type":file.mimeType,"Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`}});
}
