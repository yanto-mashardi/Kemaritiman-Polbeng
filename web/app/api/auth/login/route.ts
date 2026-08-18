import { ensureDatabase } from "../../../lib/mysql-database";
import { hashPassword, hashToken, randomHex } from "../../../lib/password";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) return Response.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  const db = await ensureDatabase();
  const account = await db.prepare("SELECT u.id,u.email,u.name,u.role,u.unit_id AS unitId,c.password_salt AS salt,c.password_hash AS passwordHash FROM users u JOIN auth_credentials c ON c.user_id=u.id WHERE u.email=? AND u.active=1").bind(email).first<{id:number;email:string;name:string;role:string;unitId:string;salt:string;passwordHash:string}>();
  if (!account || await hashPassword(body.password, account.salt) !== account.passwordHash) return Response.json({ error: "Email atau password tidak sesuai." }, { status: 401 });
  const token = randomHex();
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  await db.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)").bind(await hashToken(token), account.id, expiresAt).run();
  const response = Response.json({ user: { email: account.email, name: account.name, role: account.role, unitId: account.unitId } });
  response.headers.append("Set-Cookie", `kemaritiman_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`);
  return response;
}
