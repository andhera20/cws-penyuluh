# CWS Penyuluh Pertanian v2.0 — Login Admin/User

Starter project statis untuk GitHub Pages dengan Firebase Authentication, Cloud Firestore, Security Rules, dan Cloud Functions.

## Isi project

```text
cws-penyuluh-v2/
├── index.html
├── firestore.rules
├── README.md
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       └── firebase-config.js
├── functions/
│   ├── index.js
│   └── package.json
└── scripts/
    └── set-admin.js
```

## Penting sebelum digunakan

- Data pegawai/wilayah tidak disertakan; masukkan data resmi setelah rules dan akun diuji.
- Login menggunakan email dan password Firebase Authentication.
- Role disimpan sebagai Firebase Custom Claims (`admin` atau `user`) dan profil di koleksi `users`.
- Akses database wajib dilindungi Firestore Security Rules. Menyembunyikan menu di HTML bukan pengamanan.
- Frontend adalah contoh awal. Pengelolaan edit/hapus pegawai dan input laporan belum dibangun penuh.
- Fungsi pembuatan akun User oleh Admin memerlukan Cloud Functions. Deploy Functions umumnya membutuhkan project Firebase pada paket Blaze dan penagihan aktif; periksa biaya sebelum mengaktifkan.
- Jangan masukkan service account JSON, private key, atau password admin ke repository GitHub.
- Jangan gunakan NIP/nomor telepon nyata di repository publik tanpa dasar kewenangan dan perlindungan yang memadai.

## A. Buat Firebase project

1. Buka https://console.firebase.google.com/ dan buat project, misalnya `cws-penyuluh-lebak`.
2. Tambahkan aplikasi Web (ikon `</>`), daftarkan nama aplikasi.
3. Salin konfigurasi web ke `assets/js/firebase-config.js`.
4. Authentication → Sign-in method → aktifkan **Email/Password**.
5. Firestore Database → Create database. Untuk awal pilih production mode.
6. Authentication → Settings → Authorized domains. Tambahkan domain GitHub Pages, misalnya `USERNAME.github.io`.

## B. Pasang Firestore Rules

1. Buka Firestore Database → Rules.
2. Salin isi file `firestore.rules`.
3. Klik Publish.

Rules ini mengasumsikan Custom Claims sudah diset untuk setiap akun. Pengguna biasa hanya dapat membaca dokumen pegawai yang terikat UID-nya sendiri dan data wilayah kecamatannya. Sesuaikan skema bila satu penyuluh menangani lebih dari satu kecamatan.

## C. Buat akun Admin pertama

1. Authentication → Users → Add user. Buat email dan password admin.
2. Siapkan komputer dengan Node.js LTS.
3. Dari root folder project, jalankan:
   ```bash
   npm install firebase-admin
   ```
4. Firebase Console → Project settings → Service accounts → Generate new private key.
5. Simpan file yang diunduh sebagai `service-account.json` di root folder project. File ini rahasia dan jangan di-commit.
6. Jalankan:
   ```bash
   node scripts/set-admin.js admin@email.id
   ```
7. Setelah berhasil, hapus file service-account dari folder kerja atau simpan aman di luar project. Jika admin sudah login sebelum claims disetel, logout lalu login kembali.

## D. Deploy Cloud Function untuk Admin membuat akun User

Cloud Functions untuk membuat akun menggunakan Admin SDK agar admin tidak kehilangan sesi login ketika membuat akun baru.

1. Pastikan Firebase CLI tersedia:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```
2. Dari root project:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions:createCwsUser
   ```
3. Deploy function biasanya membutuhkan paket Blaze (pay-as-you-go), billing account, dan konfigurasi region/runtime yang didukung. Periksa biaya dan kuota Firebase sebelum deploy.
4. Setelah function aktif, login sebagai Admin. Menu **Manajemen Akun** akan muncul dan dapat digunakan membuat akun User.

## E. Deploy GitHub Pages

1. Buat repository GitHub, misalnya `cws-penyuluh`.
2. Upload `index.html`, folder `assets`, dan file frontend lain ke root repository.
3. Jangan upload `service-account.json`, `node_modules`, atau file rahasia.
4. Repository → Settings → Pages.
5. Source: **Deploy from a branch**, Branch: `main`, Folder: `/ (root)`.
6. Save. URL umumnya `https://USERNAME.github.io/cws-penyuluh/`.

## F. Struktur data Firestore

### users/{uid}
```json
{
  "name": "Nama Penyuluh",
  "email": "penyuluh@instansi.go.id",
  "role": "user",
  "district": "Cimarga"
}
```

### employees/{employeeId}
```json
{
  "uid": "UID_AUTH_PENYULUH",
  "nip": "ISI_NIP",
  "name": "Nama Penyuluh",
  "position": "Penyuluh Pertanian Ahli Pertama",
  "status": "PNS",
  "district": "Cimarga",
  "contact": "ISI_KONTAK"
}
```

### areas/{areaId}
```json
{
  "district": "Cimarga",
  "village": "Nama Desa",
  "groups": 12,
  "commodity": "Padi",
  "hectares": 120,
  "lat": -6.4,
  "lng": 106.2
}
```

### reports/{reportId}
```json
{
  "uid": "UID_AUTH_PENYULUH",
  "district": "Cimarga",
  "title": "Monitoring kegiatan",
  "description": "Uraian kegiatan",
  "createdAt": "timestamp"
}
```

Catatan: query Firestore dari frontend harus menyertakan filter yang sesuai dengan Security Rules. Contoh user mengambil employees dengan `where("uid", "==", currentUser.uid)` dan areas dengan `where("district", "==", profile.district)`.

## G. Batasan versi starter

Versi ini sudah menyediakan login, pembacaan data sesuai role, dashboard dasar, peta, dan form Admin membuat akun melalui Cloud Function. Form tambah/edit data pegawai, pengajuan laporan, approval, reset password admin, dan audit log belum termasuk. Uji dengan akun dummy sebelum mengisi data kedinasan.
