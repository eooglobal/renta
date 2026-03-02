/**
 * Calculates the Haversine distance between two points on the Earth.
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Temporary mapping of Ilorin areas to approximate coordinates for testing
export const AREA_COORDINATES = {
    'TANKE': { lat: 8.484, lon: 4.595 },
    'BASIN': { lat: 8.496, lon: 4.568 },
    'MALETE': { lat: 8.718, lon: 4.471 },
    'OTHER': null,
};
