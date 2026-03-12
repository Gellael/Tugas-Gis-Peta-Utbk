# 📍 Sistem Navigasi Pintar UTBK Universitas Bengkulu (UNIB)

Sistem Informasi Geografis (SIG) interaktif berbasis web yang dirancang secara khusus untuk memandu peserta Ujian Tulis Berbasis Komputer (UTBK) menemukan lokasi gedung ujian di kawasan Universitas Bengkulu. Sistem ini mengedepankan akurasi titik spasial dan estimasi waktu tempuh yang sangat realistis.

---

## 📖 Latar Belakang
Setiap tahun, Universitas Bengkulu menjadi pusat penyelenggaraan UTBK yang dihadiri oleh ribuan peserta dari berbagai daerah. Kompleksitas tata letak gedung kampus, minimnya petunjuk arah visual, serta ketidaktahuan peserta terhadap rute paling efisien sering kali menjadi faktor utama keterlambatan.

Aplikasi pemetaan konvensional (seperti Google Maps) sering kali memberikan estimasi waktu yang bias untuk area internal kampus karena mengabaikan variabel hambatan lokal, seperti waktu mencari tempat parkir, kepadatan gerbang, atau kecepatan berjalan kaki yang bervariasi. Oleh karena itu, sistem navigasi mandiri ini dikembangkan menggunakan *Custom Routing Algorithm* yang mengkalkulasi jarak aktual melalui *Open Source Routing Machine* (OSRM), lalu memadukannya dengan variabel kecepatan dan hambatan di dunia nyata.

## ✨ Fitur Utama
* **Integrasi GPS Real-Time:** Memanfaatkan *Browser Geolocation API* untuk melacak dan menetapkan koordinat pengguna secara otomatis dan presisi sebagai titik awal navigasi.
* **Pemetaan Titik Presisi Tinggi:** Menyediakan 8 lokasi gedung ujian resmi UTBK UNIB (LPTIK, FKIK, FEB, FISIPOL, dll.) yang telah diselaraskan dengan titik koordinat satelit yang sangat akurat hingga ke depan pintu gedung.
* **Algoritma Waktu Realistis (Physics-Based Estimation):** Menghitung waktu tempuh tidak hanya berdasarkan jarak, melainkan secara cerdas membaginya berdasarkan profil moda transportasi (Mobil, Motor, Pejalan Kaki) dengan menambahkan *overhead time* (waktu parkir dan kepadatan lalu lintas).
* **Sistem Fail-Safe Darurat:** Dilengkapi dengan mekanisme *fallback* adaptif. Jika server *routing* mengalami *timeout* atau pengguna berada di area *off-road*, sistem akan secara otomatis menarik garis lurus (jarak udara) menuju lokasi tujuan sehingga navigasi tidak akan *crash* atau membeku.
* **Antarmuka Modern (Glassmorphism UI):** Mengadaptasi tren desain *User Interface* terkini dengan efek *frosted glass*, panel *bottom-sheet* interaktif, dan animasi transisi yang mulus serta sangat responsif pada perangkat *mobile*.

## 🧮 Metodologi Kalkulasi Waktu (*Time Estimation Algorithm*)
Berbeda dengan *routing* standar yang mengasumsikan kecepatan konstan, sistem ini memodifikasi estimasi waktu menggunakan pendekatan matematis fisika dasar:

$$T_{estimasi} = \left( \frac{D}{V_{rata-rata}} \right) + C_{tunda}$$

**Keterangan Variabel:**
* **$D$** = Total jarak tempuh aktual (dalam meter) dari titik GPS pengguna ke gedung tujuan.
* **$V_{rata-rata}$** = Kecepatan rata-rata spesifik berdasarkan kendaraan (Mobil: 8.3 m/s, Motor: 11.1 m/s, Jalan Kaki: 1.25 m/s).
* **$C_{tunda}$** = Konstanta waktu tunda/parkir spesifik (Mobil: 120 detik, Motor: 60 detik, Jalan Kaki: 0 detik).

## 🛠️ Teknologi & Arsitektur Sistem
* **Frontend:** HTML5, CSS3, JavaScript (ES6+).
* **Mapping Framework:** [Leaflet.js](https://leafletjs.com/) - Pustaka JavaScript ringan untuk *rendering* peta topologi interaktif.
* **Routing Backend:** *Open Source Routing Machine* (OSRM) melalui layanan publik FOSSGIS.
* **Build Tool:** [Vite.js](https://vitejs.dev/) - Untuk kompilasi modul yang super cepat dan optimasi aset *frontend*.

---

## 🚀 Cara Instalasi & Menjalankan Server Lokal

Ikuti langkah-langkah ringkas berikut untuk menjalankan proyek ini di lingkungan pengembangan (*development*) lokal Anda:

**1. Kloning Repository**
Buka terminal/CMD dan unduh *source code* ini ke dalam direktori lokal Anda:
```bash
git clone [https://github.com/username-anda/peta-utbk.git](https://github.com/username-anda/peta-utbk.git)
cd peta-utbk
