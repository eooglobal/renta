'use client';

import Script from 'next/script';

export default function GoogleMapsLoader({ apiKey }) {
    const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!finalApiKey) {
        console.warn('Google Maps API Key is missing. Address autocomplete will be disabled.');
        return null;
    }

    return (
        <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${finalApiKey}&libraries=places&callback=initAutocomplete`}
            strategy="afterInteractive"
        />
    );
}
