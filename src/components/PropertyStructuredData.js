/**
 * Generates rich Schema.org JSON-LD structured data for a property listing
 * Enables Google Rich Snippets & AI Answer Engine Indexing (Google AI Overviews, Perplexity, ChatGPT)
 */
import { getAbsoluteImageUrl, getBaseUrl } from '@/lib/seo';

export default function PropertyStructuredData({ property }) {
    if (!property) return null;

    const baseUrl = getBaseUrl();
    const listingUrl = `${baseUrl}/listing/${property.slug || property.id}`;
    const images = (property.images && property.images.length > 0)
        ? property.images.map(img => getAbsoluteImageUrl(img.url))
        : [getAbsoluteImageUrl('/og-image.png')];

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "@id": listingUrl,
            "name": property.title,
            "url": listingUrl,
            "datePosted": property.createdAt,
            "description": property.description,
            "image": images,
            "mainEntity": {
                "@type": "SingleFamilyResidence",
                "name": property.title,
                "description": property.description,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": property.address,
                    "addressLocality": property.area?.name || "Ilorin",
                    "addressRegion": property.city?.name || "Kwara State",
                    "addressCountry": "NG"
                },
                ...(property.latitude && property.longitude ? {
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": property.latitude,
                        "longitude": property.longitude
                    }
                } : {}),
                "offers": {
                    "@type": "Offer",
                    "price": property.rentPrice,
                    "priceCurrency": "NGN",
                    "priceValidUntil": "2030-12-31",
                    "availability": property.status === 'VERIFIED' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "url": listingUrl,
                    "seller": {
                        "@type": "Organization",
                        "name": "Renta",
                        "url": baseUrl
                    }
                }
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": baseUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": property.area?.name || "Apartments",
                    "item": `${baseUrl}/tenant/search?areaId=${property.areaId || ''}`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": property.title,
                    "item": listingUrl
                }
            ]
        }
    ];

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
