export async function POST(){
  return Response.json({
    error:"Input sumber data manual dinonaktifkan. Gunakan upload evidence pada workspace agar data memiliki checksum, audit trail, dan workflow PPEPP sebelum masuk perhitungan KPI."
  },{status:410});
}
