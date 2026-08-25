import { requirePermission } from "../../../lib/authorization";
import { ensureDatabase } from "../../../lib/mysql-database";
import { hashPassword } from "../../../lib/password";

export async function GET(){const access=await requirePermission("user.manage");if(access.error)return access.error;const db=await ensureDatabase();const rows=await db.prepare("SELECT id,email,name,role,unit_id AS unitId,active FROM users ORDER BY role,name").all();return Response.json({users:rows.results})}

export async function POST(request:Request){
  const access=await requirePermission("user.manage");if(access.error)return access.error;
  const body=await request.json() as {email?:string;name?:string;role?:string;unitId?:string;password?:string};
  const roles=["ADMIN","KAJUR","SEKJUR","KAPRODI","GKM","VIEWER"];
  if(!body.email?.includes("@")||!body.name?.trim()||!body.role||!roles.includes(body.role)||!body.unitId)return Response.json({error:"Data pengguna tidak valid."},{status:400});
  const db=await ensureDatabase();
  await db.prepare("INSERT INTO users(email,name,role,unit_id,active) VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE name=VALUES(name),role=VALUES(role),unit_id=VALUES(unit_id),active=1").bind(body.email.toLowerCase(),body.name.trim(),body.role,body.unitId).run();
  const user=await db.prepare("SELECT id FROM users WHERE email=?").bind(body.email.toLowerCase()).first<{id:number}>();
  if(body.password&&body.password.length>=10&&user){const salt=crypto.randomUUID();await db.prepare("INSERT INTO auth_credentials(user_id,password_salt,password_hash) VALUES (?,?,?) ON DUPLICATE KEY UPDATE password_salt=VALUES(password_salt),password_hash=VALUES(password_hash)").bind(user.id,salt,await hashPassword(body.password,salt)).run()}
  return Response.json({ok:true},{status:201});
}

export async function PATCH(request:Request){
  const access=await requirePermission("user.manage");if(access.error)return access.error;
  const body=await request.json() as {id?:number;password?:string;active?:boolean};if(!body.id)return Response.json({error:"ID pengguna wajib diisi."},{status:400});
  const db=await ensureDatabase();
  if(typeof body.active==="boolean")await db.prepare("UPDATE users SET active=? WHERE id=?").bind(body.active?1:0,body.id).run();
  if(body.password){if(body.password.length<10)return Response.json({error:"Password minimal 10 karakter."},{status:400});const salt=crypto.randomUUID();await db.prepare("INSERT INTO auth_credentials(user_id,password_salt,password_hash) VALUES (?,?,?) ON DUPLICATE KEY UPDATE password_salt=VALUES(password_salt),password_hash=VALUES(password_hash)").bind(body.id,salt,await hashPassword(body.password,salt)).run();}
  return Response.json({ok:true});
}
