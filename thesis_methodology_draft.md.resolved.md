# BAB III: METODOLOGI PENELITIAN

## 3.1 Metode Pengembangan Sistem (Agile Scrum)

Dalam penelitian ini, metode pengembangan perangkat lunak yang digunakan adalah **Agile Development** dengan kerangka kerja **Scrum**. Metode ini dipilih karena kebutuhan fitur aplikasi Kantin Multi-Tenant yang dinamis dan membutuhkan pengembangan bertahap (iteratif) untuk memastikan setiap fungsi berjalan dengan baik sebelum melangkah ke fitur berikutnya.

Tahapan Scrum yang dilakukan dalam penelitian ini adalah sebagai berikut:

### 1. Product Backlog (Perencanaan Fitur)
Tahap ini mendefinisikan seluruh kebutuhan sistem berdasarkan masalah antrian di kantin. Daftar fitur utama meliputi:
*   Sistem Autentikasi (Login/Register) untuk Pemilik Usaha & Tenant.
*   Manajemen Tenant & Menu Makanan.
*   **Fitur Pencarian Menu Cerdas (Smart Search).**
*   Sistem Pemesanan QR Code tanpa Login (Guest Mode).

### 2. Sprint Planning & Execution
Pengembangan dibagi menjadi beberapa iterasi pendek (Sprint) dengan durasi 1-2 minggu per sprint:

*   **Sprint 1 (Fondasi & Autentikasi):** Membangun struktur database, autentikasi user, dan dashboard dasar.
*   **Sprint 2 (Manajemen Konten):** Fokus pada fitur CRUD (Create, Read, Update, Delete) untuk data Tenant dan Menu Makanan.
*   **Sprint 3 (Fitur Pencarian & Algoritma):** Implementasi **Algoritma Levenshtein Distance** pada fitur pencarian menu untuk menangani kesalahan penulisan (typo) oleh pengguna.
*   **Sprint 4 (Transaksi & QR Code):** Finalisasi alur pemesanan dari scan QR hingga checkout.

### 3. Sprint Review & Retrospective
Setiap akhir sprint, dilakukan pengujian fungsional (Black Box Testing) untuk memastikan fitur berjalan sesuai rencana. Jika ditemukan bug (seperti *overflow layout* atau error logika), perbaikan dilakukan langsung pada sprint tersebut sebelum lanjut ke sprint berikutnya.

---

## 3.2 Algoritma Sistem: Levenshtein Distance

Untuk meningkatkan pengalaman pengguna (*User Experience*) pada fitur pencarian menu, penelitian ini menerapkan algoritma **Levenshtein Distance**.

### 3.2.1 Alasan Pemilihan Algoritma
Pada aplikasi pemesanan makanan, pengguna sering melakukan kesalahan penulisan (*typo*) saat mencari menu, misalnya mengetik **"Nasi Gorng"** untuk mencari **"Nasi Goreng"**. Pencarian string biasa (*exact match*) akan gagal menemukan hasil. Oleh karena itu, dibutuhkan algoritma *Approximate String Matching* (Pencarian Samar).

Levenshtein Distance dipilih karena:
1.  **Efisien untuk Data Teks Pendek:** Sangat cepat untuk membandingkan nama menu yang rata-rata hanya terdiri dari 10-30 karakter.
2.  **Akurasi Tinggi:** Mampu mengukur tingkat kemiripan dua kata berdasarkan jumlah operasi minimal yang dibutuhkan untuk mengubah satu kata ke kata lain.

### 3.2.2 Cara Kerja Algoritma
Algoritma ini menghitung jarak (*distance*) antara **Kata Kunci Pencarian (Source)** dan **Nama Menu di Database (Target)**. Jarak dihitung berdasarkan tiga operasi dasar:
1.  **Insertion (Penyisipan):** Menambah karakter.
2.  **Deletion (Penghapusan):** Menghapus karakter.
3.  **Substitution (Penggantian):** Mengganti karakter.

Semakin kecil nilai jaraknya, semakin mirip kedua kata tersebut.

**Contoh Perhitungan:**
Mencari kata **"AYM"** (Typo) terhadap menu **"AYAM"**.
*   Jarak Levenshtein = 1 (Hanya butuh 1 operasi: Sisipkan huruf 'A').
*   Karena jaraknya kecil (di bawah ambang batas toleransi), sistem akan tetap menampilkan "AYAM" sebagai hasil pencarian.

---

## 3.3 Integrasi Algoritma dalam Pengembangan Agile

Penerapan algoritma Levenshtein Distance dilakukan pada **Sprint 3**, dengan langkah-langkah sebagai berikut:

1.  **Analisis (Sprint Planning):** Menentukan bahwa fitur pencarian standar sering gagal jika user typo. Diputuskan untuk menggunakan *fuzzy search*.
2.  **Implementasi (Sprint Execution):**
    *   Membuat fungsi `calculateLevenshtein(source, target)` di kode program (Dart/Flutter).
    *   Saat user mengetik di kolom pencarian, sistem mengambil seluruh daftar menu tenant.
    *   Sistem menghitung jarak Levenshtein antara *input user* dengan setiap *nama menu*.
    *   Menu dengan jarak terendah (paling mirip) ditampilkan di urutan teratas.
3.  **Pengujian (Sprint Review):** Menguji dengan berbagai kata kunci typo (misal: "Es Th", "Ayam Bkar") untuk memvalidasi akurasi pencarian.
