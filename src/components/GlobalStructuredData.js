/**
 * Global Schema.org JSON-LD Structured Data for Renta
 * Establishes brand & entity authority for Search Engines and AI Answer Engines
 * (Google AI Overviews, Perplexity AI, ChatGPT Search, Bing Copilot)
 */
import { getBaseUrl } from '@/lib/seo';

export default function GlobalStructuredData() {
  const baseUrl = getBaseUrl();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${baseUrl}/#organization`,
    name: 'Renta',
    legalName: 'Renta Technologies Nigeria',
    url: baseUrl,
    logo: `${baseUrl}/favicon.png`,
    image: `${baseUrl}/og-image.png`,
    description: 'Renta is a verified apartment rental marketplace in Ilorin, Kwara State, Nigeria. Rent verified self-contains, flats, and student housing directly with transparent fees and secure payments.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ilorin',
      addressRegion: 'Kwara State',
      addressCountry: 'NG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '8.4799',
      longitude: '4.5418',
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Ilorin',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Kwara State',
      },
    ],
    priceRange: '₦100,000 - ₦5,000,000 NGN',
    sameAs: [
      'https://twitter.com/renta_ng',
      'https://facebook.com/userenta',
      'https://instagram.com/userenta',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'Renta',
    description: 'Verified Apartment Rentals in Ilorin, Nigeria',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/tenant/search?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
