import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Data Koordinat
const unibCoords = {
    gerbang: [-3.755455, 102.272185],
    rektorat: [-3.757820, 102.272550],
    lptik: [-3.759240, 102.273880],
    perpus: [-3.760120, 102.272250],
    fkip: [-3.761800, 102.275100],
    ft: [-3.762850, 102.271300]
};

// Inisialisasi Map
const map = L.map('map', { zoomControl: false }).setView(unibCoords.lptik, 16);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let routingControl = null;

async function startNavigation() {
    const startVal = document.getElementById('start-point').value;
    const destVal = document.getElementById('destination').value;
    let startPoint;

    try {
        if (startVal === 'user') {
            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
            startPoint = L.latLng(pos.coords.latitude, pos.coords.longitude);
        } else {
            startPoint = L.latLng(unibCoords.gerbang);
        }

        const endPoint = L.latLng(unibCoords[destVal]);

        if (routingControl) map.removeControl(routingControl);

        routingControl = L.Routing.control({
            waypoints: [startPoint, endPoint],
            lineOptions: { styles: [{ color: '#2563eb', weight: 6 }] },
            createMarker: () => { return null; }, // Matikan marker default jika error 'ring'
            addWaypoints: false,
            draggableWaypoints: false
        }).addTo(map);

        // Tambahkan Marker manual yang lebih stabil
        L.marker(startPoint).addTo(map).bindPopup("Titik Awal").openPopup();
        L.marker(endPoint).addTo(map).bindPopup("Tujuan: " + destVal);

    } catch (err) {
        alert("Error: " + err.message);
    }
}

document.getElementById('btn-navigate').onclick = startNavigation;