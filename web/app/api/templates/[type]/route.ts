import * as XLSX from "xlsx";
const templates:Record<string,Record<string,string|number>[]>={
  TRACER:[{NIM:"2201001",NAMA:"Contoh Taruna",STATUS_PEKERJAAN:"BEKERJA",BULAN_TUNGGU:3,NAMA_INSTANSI:"Contoh Perusahaan"}],
  ACADEMIC:[{NIM:"2201001",NAMA:"Contoh Taruna",TAHUN_MASUK:2022,TAHUN_LULUS:2025,TEPAT_WAKTU:"YA"}],
  OBE:[{KODE_CPL:"CPL-01",NAMA_CPL:"Mampu menerapkan keselamatan pelayaran",NILAI:82,SEMESTER:"2025/2026 Genap"}],
  LAB:[{LAB_ID:1,NAMA_LAB:"Bridge & Navigation Simulator",JAM_TERSEDIA:1000,JAM_DIGUNAKAN:850}],
  DOSEN:[{NIDN:"0012345678",NAMA:"Nama Dosen",PRODI:"NAUTIKA",EMAIL:"dosen@polbeng.ac.id",BIDANG_KEAHLIAN:"Navigasi",SCHOLAR_ID:"xxxxxxxxxxxx"}]
};
export async function GET(_:Request,{params}:{params:Promise<{type:string}>}){const type=(await params).type.toUpperCase(),rows=templates[type];if(!rows)return new Response("Template tidak tersedia",{status:404});const workbook=XLSX.utils.book_new(),sheet=XLSX.utils.json_to_sheet(rows);XLSX.utils.book_append_sheet(workbook,sheet,"DATA");const bytes=XLSX.write(workbook,{type:"buffer",bookType:"xlsx"});return new Response(bytes,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename=template-${type.toLowerCase()}.xlsx`}})}
