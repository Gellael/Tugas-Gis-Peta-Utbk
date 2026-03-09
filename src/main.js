import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// HAPUS IMPORT leaflet-routing-machine KARENA KITA AKAN MENGAMBIL DATA SECARA LANGSUNG (ANTI-BUG)

// FIX ICON VITE (Agar ikon pin biru muncul)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// DATA KOORDINAT KAMPUS UNIB
const unib = {
    gerbang: [-3.752355, 102.270515],
    rektorat: [-3.755380, 102.271370],
    auditorium: [-3.754800, 102.271500],
    lptik: [-3.756810, 102.271920],   
    perpus: [-3.758110, 102.271750],  
    gkb: [-3.759000, 102.272500],
    fkip: [-3.759550, 102.273210],    
    ft: [-3.761220, 102.274450],      
    mipa: [-3.754980, 102.274150],    
    fk: [-3.753500, 102.272000],
    feb: [-3.757220, 102.275880],
    fh: [-3.756500, 102.275000],
    fisip: [-3.758500, 102.276000],
    fp: [-3.760500, 102.275500]
};

const simulasi = {
    pantai: [-3.827361, 102.261944]
};

let map, routeLine, markerStart, markerEnd;

document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map', { zoomControl: false }).setView(unib.rektorat, 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    document.getElementById('btn-start').addEventListener('click', () => {
        const startPilih = document.getElementById('start').value;
        const destPilih = document.getElementById('dest').value;
        const target = unib[destPilih];
        
        document.getElementById('label').innerText = document.getElementById('dest').options[document.getElementById('dest').selectedIndex].text;

        document.getElementById('landing-page').style.transform = "translateY(-100%)";
        document.getElementById('map').classList.add('active');
        document.getElementById('ui').style.display = "flex";

        setTimeout(() => {
            map.invalidateSize(); 
            mulaiNavigasi(startPilih, target);
        }, 600);
    });

    document.getElementById('btn-back').addEventListener('click', () => location.reload());
    document.getElementById('panel-toggle').addEventListener('click', () => document.getElementById('route-panel').classList.toggle('collapsed'));
});

function mulaiNavigasi(startKode, dest) {
    if (startKode === 'user') {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (p) => drawRouteManual([p.coords.latitude, p.coords.longitude], dest),
                (err) => {
                    alert("GPS gagal terbaca. Dialihkan ke Gerbang UNIB.");
                    drawRouteManual(unib.gerbang, dest);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            drawRouteManual(unib.gerbang, dest);
        }
    } else if (startKode === 'pantai') {
        drawRouteManual(simulasi.pantai, dest);
    } else {
        drawRouteManual(unib.gerbang, dest);
    }
}

// 🚀 FUNGSI BARU: FETCH DATA MANUAL (ANTI-NGADAT)
async function drawRouteManual(start, end) {
    // 1. Bersihkan peta dari rute sebelumnya
    if (routeLine) map.removeLayer(routeLine);
    if (markerStart) map.removeLayer(markerStart);
    if (markerEnd) map.removeLayer(markerEnd);

    // 2. Tampilkan UI Loading
    document.getElementById('route-panel').style.display = 'flex';
    document.getElementById('panel-title').innerText = "Mencari Rute...";
    document.getElementById('panel-meta').innerText = "Mengambil koordinat satelit...";
    document.getElementById('instruction-list').innerHTML = '';

    // 3. Pasang Titik Awal & Tujuan
    markerStart = L.marker(start).addTo(map).bindPopup("Titik Awal").openPopup();
    markerEnd = L.marker(end).addTo(map).bindPopup("Tujuan Ujian");
    map.fitBounds(L.latLngBounds(start, end), { padding: [60, 60] });

    try {
        // PERINTAH LANGSUNG KE SERVER (Format OSRM: Longitude, Latitude)
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal terhubung ke server peta.");
        
        const data = await response.json();
        if (data.code !== 'Ok') throw new Error("Jalur tidak ditemukan di area ini.");

        const ruteInfo = data.routes[0];
        
        // Konversi koordinat dari [Lng, Lat] menjadi [Lat, Lng] untuk Leaflet
        const koordinatJalan = ruteInfo.geometry.coordinates.map(c => [c[1], c[0]]);

        // 4. GAMBAR GARIS BIRU DI PETA
        routeLine = L.polyline(koordinatJalan, { color: '#2563eb', weight: 6, opacity: 0.8 }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        // 5. UPDATE PANEL INFORMASI
        document.getElementById('panel-title').innerText = "Rute Ditemukan";
        const jarakKm = (ruteInfo.distance / 1000).toFixed(1);
        const waktuMenit = Math.max(1, Math.round(ruteInfo.duration / 60));
        document.getElementById('panel-meta').innerText = `Jarak: ${jarakKm} km | Estimasi: ${waktuMenit} menit`;

        // 6. BUAT INSTRUKSI BELOKAN (Diterjemahkan Manual)
        const list = document.getElementById('instruction-list');
        list.innerHTML = '';

        ruteInfo.legs[0].steps.forEach(step => {
            const modifier = step.maneuver.modifier || '';
            const type = step.maneuver.type || '';
            
            let iconClass = 'ri-arrow-up-line';
            let arah = 'Terus lurus';

            if (modifier.includes('right')) {
                iconClass = 'ri-corner-up-right-line'; arah = 'Belok kanan';
            } else if (modifier.includes('left')) {
                iconClass = 'ri-corner-up-left-line'; arah = 'Belok kiri';
            } else if (type === 'arrive') {
                iconClass = 'ri-map-pin-2-fill'; arah = 'Sampai di tujuan';
            }

            const namaJalan = step.name ? ` ke ${step.name}` : '';
            const teksInstruksi = `${arah}${namaJalan}`;
            const jarakStep = step.distance > 0 ? `<span class="step-dist">Lanjut sejauh ${Math.round(step.distance)} meter</span>` : '';

            list.innerHTML += `
                <div class="step">
                    <div class="step-icon"><i class="${iconClass}"></i></div>
                    <div class="step-text">
                        ${teksInstruksi}
                        ${jarakStep}
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Gagal menarik rute:", err);
        // JIKA SERVER BENAR-BENAR MATI (GARIS DARURAT MERAH)
        document.getElementById('panel-title').innerText = "Mode Peta Manual";
        document.getElementById('panel-meta').innerText = "Server sedang sibuk/offline.";
        document.getElementById('instruction-list').innerHTML = `
            <div style="padding: 15px; text-align: center; color: #ef4444;">
                <i class="ri-route-line" style="font-size: 2rem;"></i>
                <p>Gagal menarik garis biru otomatis. Garis merah putus-putus menunjukkan arah lurus menuju lokasi tujuan Anda.</p>
            </div>
        `;
        routeLine = L.polyline([start, end], {color: '#ef4444', weight: 4, dashArray: '10, 10'}).addTo(map);
    }
}