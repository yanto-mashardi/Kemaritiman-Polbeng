# Arsitektur Aplikasi Jurusan Kemaritiman Polbeng

## 1. Pemisahan aplikasi

- `/` adalah website publik Jurusan Kemaritiman/UPPS.
- `/workspace` adalah ruang kerja internal berbasis role.
- `/api/public` hanya mengirim data yang aman untuk publik.
- `/api/portal` hanya dapat dibaca user dengan permission `workspace.read`.

## 2. Role dan permission

Role utama: `ADMIN`, `KAJUR`, `SEKJUR`, `KAPRODI`, `GKM`, `VIEWER`.

Kewenangan tidak lagi ditentukan oleh tombol UI. Semua route sensitif memanggil permission policy pada `web/app/lib/permissions.ts` dan pemeriksaan unit pada `authorization.ts`.

## 3. Siklus PPEPP

Evidence mengikuti status:

`DRAFT → SUBMITTED → REVIEWED/EVALUATED → APPROVED → FOLLOW_UP → CLOSED`

Implementasi operasional saat ini:

- Upload Excel menghasilkan evidence + checksum + audit log + workflow `SUBMITTED`.
- GKM/Admin dengan `evaluation.manage` melakukan evaluasi.
- Kajur/Admin dengan `approval.manage` memberikan approval.
- Pemilik proses dengan `corrective_action.manage` melakukan tindak lanjut.
- KPI dihitung hanya dari evidence `APPROVED` atau `CLOSED`.

## 4. Integrasi OBE

Evidence `OBE` menghasilkan `outcome_results` per program studi. Hasil rinci dapat dibaca di workspace untuk review. Agregasi CPL menjadi realisasi KPI hanya setelah workflow evidence OBE memperoleh approval.

## 5. Kebijakan publikasi

- Dokumen tampil di website publik hanya bila `documents.visibility='PUBLIK'`.
- Ringkasan mutu tampil hanya bila workflow `APPROVED/CLOSED` dan `approved_by` terisi.
- Endpoint publik tidak mengirim email dosen, file evidence, data audit, atau hasil OBE mentah.

## 6. Keamanan credential

Password default bersama lama `Polbeng#2026` tidak lagi dibuat. Saat migrasi pertama, hanya credential yang masih cocok dengan password legacy tersebut yang dihapus dan sesi terkait diinvalidasi. Credential yang telah diubah tetap dipertahankan.

Untuk bootstrap Admin yang belum mempunyai password, isi secret deployment:

`INITIAL_ADMIN_PASSWORD=<password kuat>`

Setelah Admin dapat login, credential role lain dapat dibuat/diperbarui melalui menu Pengguna di workspace.

## 7. Jalur input data

Endpoint lama `/api/admin/source-data` dinonaktifkan agar tidak ada input angka KPI yang melewati evidence dan PPEPP. Input sumber dilakukan melalui template Excel/evidence sehingga file asli, checksum, uploader, jumlah baris, waktu, dan audit trail tersedia.

## 8. Catatan deployment

Sebelum merge/deploy:

1. Set `MYSQL_*` seperti sebelumnya.
2. Set `INITIAL_ADMIN_PASSWORD` bila akun Admin belum memiliki credential non-legacy.
3. Jalankan `npm ci`.
4. Jalankan `npm run build`.
5. Verifikasi `/`, `/workspace`, login Admin, upload evidence, evaluasi GKM, approval Kajur, dan perubahan KPI setelah approval.
