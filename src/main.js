import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const unib = {
    lptik: [-3.758372916495219, 102.27494967197975],        
    fkik: [-3.754979862955153, 102.27795980347213],         
    feb_s: [-3.761868617946405, 102.26894259002916],        
    fisipol: [-3.759177453212331, 102.27455299895848],      
    lab_bahasa: [-3.7583322348586847, 102.27570889626327],  
    lab_si: [-3.758429547087232, 102.27738935799476],       
    perpus: [-3.756854385257199, 102.27481448506444],       
    lab_hukum: [-3.7604411985889215, 102.26866685243749],   
    gerbang_depan: [-3.7600026923330034, 102.26706348042904]
};

let map, routeLine, markerStart, markerEnd;

document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map', { zoomControl: false }).setView(unib.lptik, 16);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    document.getElementById('btn-start').addEventListener('click', () => {
        const destPilih = document.getElementById('dest').value;
        const modePilih = document.getElementById('mode').value; 
        const target = unib[destPilih];
        
        document.getElementById('label').innerText = document.getElementById('dest').options[document.getElementById('dest').selectedIndex].text;

        document.getElementById('landing-page').style.transform = "translateY(-100%)";
        document.getElementById('map').classList.add('active');
        document.getElementById('ui').style.display = "flex";

        setTimeout(() => {
            map.invalidateSize(); 
            mulaiNavigasi(target, modePilih); 
        }, 600);
    });

    document.getElementById('btn-back').addEventListener('click', () => location.reload());
    document.getElementById('panel-toggle').addEventListener('click', () => document.getElementById('route-panel').classList.toggle('collapsed'));
});

function mulaiNavigasi(dest, mode) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (p) => drawRouteManual([p.coords.latitude, p.coords.longitude], dest, mode),
            (err) => {
                alert("GPS kamu nggak terbaca nih. Kita arahkan dari Gerbang Depan UNIB dulu ya.");
                drawRouteManual(unib.gerbang_depan, dest, mode);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        alert("Browser kamu nggak support GPS.");
        drawRouteManual(unib.gerbang_depan, dest, mode);
    }
}

async function drawRouteManual(start, end, mode) {
    if (routeLine) map.removeLayer(routeLine);
    if (markerStart) map.removeLayer(markerStart);
    if (markerEnd) map.removeLayer(markerEnd);

    document.getElementById('route-panel').style.display = 'flex';
    document.getElementById('panel-title').innerText = "Tunggu ya...";
    document.getElementById('panel-meta').innerText = "Lagi ngitung rute dan waktu tempuhnya...";
    document.getElementById('instruction-list').innerHTML = '';

    markerStart = L.marker(start).addTo(map).bindPopup("Posisi Kamu").openPopup();
    markerEnd = L.marker(end).addTo(map).bindPopup("Lokasi Ujian");
    map.fitBounds(L.latLngBounds(start, end), { padding: [60, 60] });

    try {
        const profileOSRM = (mode === 'jalan') ? 'foot' : 'driving';
        const url = `https://router.project-osrm.org/route/v1/${profileOSRM}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Koneksi gagal.");
        
        const data = await response.json();
        if (data.code !== 'Ok') throw new Error("Rute tidak ketemu.");

        const ruteInfo = data.routes[0];
        const koordinatJalan = ruteInfo.geometry.coordinates.map(c => [c[1], c[0]]);

        let warnaGaris = '#2563eb'; 
        if (mode === 'jalan') warnaGaris = '#10b981'; 

        routeLine = L.polyline(koordinatJalan, { color: warnaGaris, weight: 6, opacity: 0.8 }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        const jarakMeter = ruteInfo.distance;
        let durasiRealistis = 0;
        let labelMode = "";

        if (mode === 'mobil') {
            durasiRealistis = (jarakMeter / 8.3) + 120; 
            labelMode = "Mobil";
        } else if (mode === 'motor') {
            durasiRealistis = (jarakMeter / 11.1) + 60; 
            labelMode = "Motor";
        } else {
            durasiRealistis = (jarakMeter / 1.25);
            labelMode = "Jalan Kaki";
        }

        const jarakKm = (jarakMeter / 1000).toFixed(1);
        const waktuMenit = Math.max(1, Math.round(durasiRealistis / 60));
        
        document.getElementById('panel-title').innerText = "Ketemu nih!";
        document.getElementById('panel-meta').innerText = `Jarak: ${jarakKm} km | Waktu: ${waktuMenit} menit (${labelMode})`;

        const list = document.getElementById('instruction-list');
        list.innerHTML = '';

        ruteInfo.legs[0].steps.forEach(step => {
            const modifier = step.maneuver.modifier || '';
            const type = step.maneuver.type || '';
            
            let iconClass = 'ri-arrow-up-line';
            let arah = 'Jalan lurus terus';

            if (modifier.includes('right')) {
                iconClass = 'ri-corner-up-right-line'; arah = 'Belok kanan';
            } else if (modifier.includes('left')) {
                iconClass = 'ri-corner-up-left-line'; arah = 'Belok kiri';
            } else if (type === 'arrive') {
                iconClass = 'ri-map-pin-2-fill'; arah = 'Kamu sampai di tujuan!';
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
        let alasanError = "Ups, rute nggak ketemu nih.";
        if (mode === 'jalan') {
            alasanError = "Kejauhan kalau jalan kaki, mending ganti naik motor/mobil aja.";
        } else {
            alasanError = "Server petanya lagi sibuk.";
        }

        document.getElementById('panel-title').innerText = "Pakai Peta Biasa Dulu Ya";
        document.getElementById('panel-meta').innerText = alasanError;
        document.getElementById('instruction-list').innerHTML = `
            <div style="padding: 15px; text-align: center; color: #ef4444;">
                <i class="ri-route-line" style="font-size: 2rem;"></i>
                <p>Garis jalannya gagal dimuat. Kamu bisa ikutin patokan garis merah putus-putus ini buat arah kasarnya ya.</p>
            </div>
        `;
        routeLine = L.polyline([start, end], {color: '#ef4444', weight: 4, dashArray: '10, 10'}).addTo(map);
    }
}