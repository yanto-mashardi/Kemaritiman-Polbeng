import { currentPortalUser } from "../../lib/authorization";

export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ user: await currentPortalUser() }); }
