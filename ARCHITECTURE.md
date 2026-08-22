# Arsitektur Aplikasi Jurusan Kemaritiman Polbeng

## 1. Pemisahan aplikasi

- `/` adalah website publik Jurusan Kemaritiman/UPPS.
- `/workspace` adalah ruang kerja internal berbasis role.
- `/api/public` hanya mengirim data yang memang ditetapkan untuk konsumsi publik.
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
- Profil dosen yang aktif dapat dipublikasikan, termasuk NIDN, bidang keahlian, Google Scholar, foto, dan email institusi/profesional untuk kontak akademik.
- Endpoint publik tidak mengirim file evidence, audit log, credential, session, atau hasil OBE mentah.

## 6. Keamanan credential

Password default bersama lama `Polbeng#2026` tidak lagi dibuat. Saat migrasi pertama, hanya credential yang masih cocok dengan password legacy tersebut yang dihapus dan sesi terkait diinvalidasi. Credential yang telah diubah tetap dipertahankan.

Untuk bootstrap Admin yang belum mempunyai password, isi secret deployment:

`INITIAL_ADMIN_PASSWORD=<password kuat>`

Setelah Admin dapat login, credential role lain dapat dibuat/diperbarui melalui menu Pengguna di workspace.

## 7. Jalur input data

Endpoint lama `/api/admin/source-data` dinonaktifkan agar tidak ada input angka KPI yang melewati evidence dan PPEPP. Input sumber dilakukan melalui template Excel/evidence sehingga file asli, checksum, uploader, jumlah baris, waktu, dan audit trail tersedia.

## 8. Migrasi database lokal dan deployment

Database MySQL lokal yang sudah digunakan sebelumnya dapat tetap dipakai. Perubahan arsitektur memang dimaksudkan untuk memigrasikan database tersebut pada saat aplikasi baru dijalankan. `ensureDatabase()` akan mempertahankan tabel lama yang masih digunakan dan membuat tabel baru yang diperlukan, termasuk workflow PPEPP.

Tidak ada kewajiban membuat database baru khusus pengujian. Database terpisah hanya diperlukan bila ingin melakukan pengujian destruktif atau menjaga dataset lama tetap identik sebagai pembanding.

Sebelum menjalankan branch refactor pada database lokal yang sekarang, buat backup terlebih dahulu. Setelah pengujian lokal berhasil, lakukan backup database produksi sebelum deployment ke VPS.

Sebelum merge/deploy:

1. Backup database lokal yang sekarang.
2. Gunakan konfigurasi `MYSQL_*` lokal yang sudah ada.
3. Set `INITIAL_ADMIN_PASSWORD` bila akun Admin belum memiliki credential non-legacy.
4. Jalankan `npm ci`.
5. Jalankan `npm run build`.
6. Jalankan aplikasi dan biarkan `ensureDatabase()` melakukan penyesuaian skema.
7. Verifikasi `/`, `/workspace`, login Admin, upload evidence, evaluasi GKM, approval Kajur, dan perubahan KPI setelah approval.
8. Setelah lokal lolos, backup MySQL VPS, merge ke `main`, lalu deploy `main` ke VPS.
