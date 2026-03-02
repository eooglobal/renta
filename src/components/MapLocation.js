'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

export default function MapLocation({ address, center = [8.4966, 4.5421], zoom = 14 }) {
    // Note: Ilorin rough coordinates are [8.4966, 4.5421]

    useEffect(() => {
        // Any browser side initializations
    }, []);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={false}
            style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-lg)', zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={customIcon}>
                <Popup>{address}</Popup>
            </Marker>
        </MapContainer>
    );
}
