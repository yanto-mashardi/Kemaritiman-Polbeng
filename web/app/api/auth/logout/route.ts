import { headers } from "next/headers";
import { ensureDatabase } from "../../../lib/mysql-database";
import { hashToken } from "../../../lib/password";

export async function POST() {
  const requestHeaders = await headers();
  const token = requestHeaders.get("cookie")?.match(/(?:^|;\s*)kemaritiman_session=([^;]+)/)?.[1];
  if (token) {
    const db = await ensureDatabase();
    await db.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(await hashToken(decodeURIComponent(token))).run();
  }
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", "kemaritiman_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return response;
}
