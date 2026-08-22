import { currentPortalUser, requirePermission } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";

type Status="DRAFT"|"SUBMITTED"|"REVIEWED"|"EVALUATED"|"APPROVED"|"FOLLOW_UP"|"CLOSED";
const allowed:Record<Status,Status[]>={
  DRAFT:["SUBMITTED"],
  SUBMITTED:["REVIEWED","EVALUATED"],
  REVIEWED:["EVALUATED"],
  EVALUATED:["APPROVED","FOLLOW_UP"],
  APPROVED:["FOLLOW_UP","CLOSED"],
  FOLLOW_UP:["CLOSED"],
  CLOSED:[],
};

function permissionFor(next:Status){
  if(next==="REVIEWED"||next==="EVALUATED")return "evaluation.manage" as const;
  if(next==="APPROVED")return "approval.manage" as const;
  if(next==="FOLLOW_UP"||next==="CLOSED")return "corrective_action.manage" as const;
  return "workspace.read" as const;
}

export async function GET(){
  const user=await currentPortalUser();
  if(!user.email)return Response.json({error:"Silakan login."},{status:401});
  const access=await requirePermission("workspace.read");if(access.error)return access.error;
  const db=await ensureDatabase();
  const rows=user.role==="KAPRODI"
    ?await db.prepare("SELECT * FROM workflow_items WHERE unit_id=? ORDER BY updated_at DESC").bind(user.unitId).all()
    :await db.prepare("SELECT * FROM workflow_items ORDER BY updated_at DESC").all();
  return Response.json({workflows:rows.results});
}

export async function PATCH(request:Request){
  const body=await request.json() as {id?:number;status?:Status;finding?:string;recommendation?:string;correctiveAction?:string;note?:string;dueAt?:number};
  if(!body.id||!body.status)return Response.json({error:"Workflow dan status wajib diisi."},{status:400});
  const db=await ensureDatabase();
  const item=await db.prepare("SELECT id,unit_id AS unitId,status FROM workflow_items WHERE id=?").bind(body.id).first<{id:number;unitId:string;status:Status}>();
  if(!item)return Response.json({error:"Workflow tidak ditemukan."},{status:404});
  if(!allowed[item.status]?.includes(body.status))return Response.json({error:`Transisi ${item.status} → ${body.status} tidak diizinkan.`},{status:409});
  const access=await requirePermission(permissionFor(body.status),item.unitId);if(access.error)return access.error;
  const now=Date.now();
  const stage=body.status==="EVALUATED"?"EVALUASI":body.status==="APPROVED"?"PENGENDALIAN":body.status==="FOLLOW_UP"||body.status==="CLOSED"?"PENINGKATAN":"PELAKSANAAN";
  await db.prepare("UPDATE workflow_items SET status=?,stage=?,reviewer_email=CASE WHEN ? IN ('REVIEWED','EVALUATED') THEN ? ELSE reviewer_email END,approved_by=CASE WHEN ?='APPROVED' THEN ? ELSE approved_by END,finding=COALESCE(?,finding),recommendation=COALESCE(?,recommendation),corrective_action=COALESCE(?,corrective_action),due_at=COALESCE(?,due_at),updated_at=? WHERE id=?")
    .bind(body.status,stage,body.status,access.user.email,body.status,access.user.email,body.finding??null,body.recommendation??null,body.correctiveAction??null,body.dueAt??null,now,body.id).run();
  await db.prepare("INSERT INTO workflow_events(workflow_id,from_status,to_status,actor_email,actor_role,note,created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(body.id,item.status,body.status,access.user.email,access.user.role,body.note??null,now).run();
  await db.prepare("INSERT INTO audit_logs(user_email,role,action,entity,entity_id,created_at) VALUES (?,?,?,?,?,?)")
    .bind(access.user.email,access.user.role,`WORKFLOW_${body.status}`,"WORKFLOW",String(body.id),now).run();
  return Response.json({ok:true,status:body.status});
}
