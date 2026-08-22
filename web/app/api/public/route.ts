import { ensureDatabase } from "../../lib/mysql-database";

export const dynamic="force-dynamic";

export async function GET(){
  try{
    const db=await ensureDatabase();
    const [documents,repositories,laboratories,lecturers,approvedQuality]=await Promise.all([
      db.prepare("SELECT id,title,type,unit_id AS unitId,year,url FROM documents WHERE visibility='PUBLIK' ORDER BY year DESC,id DESC LIMIT 24").all(),
      db.prepare("SELECT id,title,author,year,type,program_id AS programId,url FROM repositories ORDER BY year DESC,id DESC LIMIT 12").all(),
      db.prepare("SELECT id,name,field FROM laboratories ORDER BY id").all(),
      db.prepare("SELECT id,nidn,name,program_id AS programId,expertise,scholar_url AS scholarUrl,photo_url AS photoUrl FROM lecturers WHERE active=1 ORDER BY program_id,name").all(),
      db.prepare("SELECT id,title,unit_id AS unitId,stage,status,year FROM workflow_items WHERE status IN ('APPROVED','CLOSED') ORDER BY updated_at DESC LIMIT 8").all(),
    ]);
    return Response.json({
      programs:[
        {id:"NAUTIKA",name:"D3 Nautika",level:"Diploma Tiga"},
        {id:"KPN",name:"D3 Ketatalaksanaan Pelayaran Niaga",level:"Diploma Tiga"}
      ],
      documents:documents.results,
      repositories:repositories.results,
      laboratories:laboratories.results,
      lecturers:lecturers.results,
      quality:approvedQuality.results,
    });
  }catch(error){
    return Response.json({error:error instanceof Error?error.message:"Data publik gagal dibaca."},{status:500});
  }
}
