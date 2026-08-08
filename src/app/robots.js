import { getBaseUrl } from '@/lib/seo';

export default function robots() {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/tenant/',
          '/tenant/*',
          '/landlord/',
          '/landlord/*',
          '/scout/',
          '/scout/*',
          '/affiliate/',
          '/affiliate/*',
          '/api/',
          '/api/*',
          '/verify-otp',
          '/reset-password',
        ],
      },
      {
        // Allow AI Crawlers for Answer Engine Optimization (AEO)
        userAgent: [
          'Googlebot',
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Bingbot',
          'Applebot',
        ],
        allow: [
          '/',
          '/listing/*',
          '/about',
          '/contact',
          '/terms',
          '/privacy',
          '/scout-program',
          '/affiliate-program',
        ],
        disallow: [
          '/admin/*',
          '/tenant/*',
          '/landlord/*',
          '/scout/*',
          '/affiliate/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
