/**
 * SEO & OpenGraph Utility Helpers for Renta
 * Ensures valid absolute URLs for social sharing previews (WhatsApp, Twitter/X, Facebook, iMessage, LinkedIn)
 */

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return 'https://userenta.com';
}

/**
 * Ensures any image URL (R2 cloud URL, relative path, or external URL) is a valid absolute HTTPS URL.
 * Social preview scrapers (WhatsApp, Facebook, Twitter) require full absolute URLs starting with https://.
 */
export function getAbsoluteImageUrl(imageUrl) {
  const defaultOgImage = `${getBaseUrl()}/og-image.png`;
  if (!imageUrl) return defaultOgImage;

  const str = String(imageUrl).trim();
  if (!str) return defaultOgImage;

  // Already an absolute URL with protocol
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // Relative path starting with slash
  if (str.startsWith('/')) {
    return `${getBaseUrl()}${str}`;
  }

  // Relative path without leading slash
  return `${getBaseUrl()}/${str}`;
}

/**
 * Builds standard OpenGraph and Twitter metadata object for Next.js pages
 */
export function buildPageMetadata({
  title,
  description,
  image,
  path = '',
  keywords,
  noIndex = false
}) {
  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}${path ? (path.startsWith('/') ? path : `/${path}`) : ''}`;
  const absoluteImage = getAbsoluteImageUrl(image);

  const meta = {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Renta',
      locale: 'en_NG',
      type: 'website',
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImage],
      creator: '@renta_ng',
      site: '@renta_ng',
    },
  };

  if (keywords) {
    meta.keywords = keywords;
  }

  if (noIndex) {
    meta.robots = {
      index: false,
      follow: false,
    };
  } else {
    meta.robots = {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    };
  }

  return meta;
}
