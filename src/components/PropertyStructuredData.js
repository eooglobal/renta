/**
 * Generates JSON-LD structured data for a property listing
 * This helps Google display rich results (price, availability) in search
 */
export default function PropertyStructuredData({ property }) {
    if (!property) return null;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Accommodation",
        "name": property.title,
        "description": property.description,
        "image": property.images?.map(img => img.url) || [],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": property.address,
            "addressLocality": property.area?.name || "Ilorin",
            "addressRegion": property.city?.name || "Kwara State",
            "addressCountry": "NG"
        },
        "offers": {
            "@type": "Offer",
            "price": property.rentPrice,
            "priceCurrency": "NGN",
            "availability": property.status === 'VERIFIED' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "category": property.type
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
