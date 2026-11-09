# CWS Penyuluh Pertanian

Website statis untuk GitHub Pages. Teknologi:
- HTML5
- Tailwind CSS melalui CDN
- CSS tambahan di `assets/css/styles.css`
- JavaScript di `assets/js/`
- Chart.js untuk grafik
- Leaflet + OpenStreetMap untuk peta

## Struktur folder

```text
cws-penyuluh/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── styles.css
    └── js/
        ├── data.js
        └── app.js
```

## Menjalankan lokal
Buka `index.html` di browser. Untuk hasil terbaik, jalankan server lokal sederhana, misalnya ekstensi Live Server di VS Code.

## Mengganti data
Edit `assets/js/data.js`:
- `employees`: NIP, nama, jabatan, status, wilayah kerja, kontak.
- `areas`: kecamatan, desa, jumlah kelompok tani, komoditas, luas lahan, koordinat latitude/longitude.
- `stats`: total luas lahan dan capaian program.
- `programs`: target dan realisasi program.

Data yang disertakan adalah data dummy untuk contoh. Ganti sebelum dipublikasikan. Jangan unggah NIP, nomor telepon, atau informasi pribadi pegawai ke repositori publik kecuali memang diizinkan dan memiliki dasar kewenangan. GitHub Pages bersifat publik.

## Deploy ke GitHub Pages
1. Masuk ke GitHub dan buat repository baru, misalnya `cws-penyuluh`.
2. Unggah seluruh isi folder ini ke root repository. Pastikan `index.html` berada di root, bukan di dalam subfolder tambahan.
3. Buka **Settings → Pages** pada repository.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
6. Tunggu proses publikasi selesai. URL umumnya berbentuk `https://USERNAME.github.io/cws-penyuluh/`.
7. Setiap perubahan yang di-push ke branch `main` akan dipublikasikan otomatis.

## Catatan penting
- Website ini front-end statis. Data di `data.js` tertanam di browser dan dapat dilihat pengunjung.
- Fitur pencarian/filter dan unduh CSV berjalan di browser.
- Peta memerlukan internet dan koordinat yang benar.
- Untuk login, hak akses, penyimpanan data terpusat, input/edit data, dan verifikasi berjenjang, GitHub Pages saja tidak cukup. Gunakan backend/API dan database terpisah (misalnya Firebase/Supabase atau server instansi) serta aturan keamanan yang sesuai.
- CDN Tailwind, Chart.js, Leaflet, dan OpenStreetMap memerlukan koneksi internet.
