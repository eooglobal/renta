import { prisma } from '@/lib/db';
import { getBaseUrl } from '@/lib/seo';

export default async function sitemap() {
  const baseUrl = getBaseUrl();

  // Static public routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/acceptable-use',
    '/dispute-resolution',
    '/refund-policy',
    '/scout-program',
    '/affiliate-program',
    '/login',
    '/register',
    '/forgot-password',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch active verified listings for dynamic sitemap URLs
  try {
    const verifiedProperties = await prisma.property.findMany({
      where: { status: 'VERIFIED' },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    const propertyRoutes = verifiedProperties.map((prop) => ({
      url: `${baseUrl}/listing/${prop.slug || prop.id}`,
      lastModified: (prop.updatedAt || new Date()).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    return [...staticRoutes, ...propertyRoutes];
  } catch (error) {
    console.error('[Sitemap Generation Error]:', error);
    return staticRoutes;
  }
}
