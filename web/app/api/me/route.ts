import { currentPortalUser } from "../../lib/authorization";
import { permissionsFor } from "../../lib/permissions";

export const dynamic="force-dynamic";
export async function GET(){
  const user=await currentPortalUser();
  return Response.json({user,permissions:permissionsFor(user.role)});
}
