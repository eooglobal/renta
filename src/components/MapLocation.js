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

// Default: Ilorin rough coordinates
const DEFAULT_CENTER = [8.4966, 4.5421];

export default function MapLocation({ address, center, zoom = 14 }) {
    // Normalise center: accept [lat, lng] array or { lat, lng } object
    let normalizedCenter = DEFAULT_CENTER;
    if (center) {
        if (Array.isArray(center)) {
            normalizedCenter = center;
        } else if (center.lat !== undefined && center.lng !== undefined) {
            normalizedCenter = [center.lat, center.lng];
        }
    }

    useEffect(() => {
        // Any browser side initializations
    }, []);

    return (
        <MapContainer
            center={normalizedCenter}
            zoom={zoom}
            scrollWheelZoom={false}
            style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-lg)', zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={normalizedCenter} icon={customIcon}>
                <Popup>{address}</Popup>
            </Marker>
        </MapContainer>
    );
}
