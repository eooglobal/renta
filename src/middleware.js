import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

export default NextAuth(authConfig).auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session;
    const pathname = nextUrl.pathname;

    // ── CSRF Protection for state-changing API requests ──
    const isApiRoute = pathname.startsWith('/api/');
    const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const isWebhook = pathname.startsWith('/api/webhooks/'); // Webhooks use HMAC signatures instead

    if (isApiRoute && isStateChangingMethod && !isWebhook) {
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');
        if (origin) {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return NextResponse.json(
                    { error: 'CSRF validation failed' },
                    { status: 403 }
                );
            }
        }
    }

    // Public routes that don't need auth
    const publicRoutes = ['/', '/login', '/register', '/listings', '/about', '/contact', '/terms', '/privacy'];
    const isPublicRoute = publicRoutes.some(route => pathname === route) || pathname.startsWith('/listing/');

    // Explicit allowlist for public API routes
    const publicApiRoutes = [
        '/api/properties',       // Property listings
        '/api/locations/cities', // Fetching cities
        '/api/locations/areas',  // Fetching areas
        '/api/webhooks/paystack' // Payment webhooks
    ];
    // Allow public API routes exactly, or any NextAuth routes which handle their own sessions
    const isPublicApiRoute = publicApiRoutes.includes(pathname) || pathname.startsWith('/api/auth');

    const isAuthRoute = pathname === '/login' || pathname === '/register';

    // Allow public routes and explicit public API routes
    if (isPublicRoute || isPublicApiRoute) {
        // Redirect logged-in users away from auth pages
        if (isAuthRoute && isLoggedIn) {
            const roleRoutes = {
                TENANT: '/tenant',
                LANDLORD: '/landlord',
                SCOUT: '/scout',
                AFFILIATE: '/affiliate',
                ADMIN: '/admin',
            };
            const redirectPath = roleRoutes[session.user?.role] || '/tenant';
            return NextResponse.redirect(new URL(redirectPath, nextUrl));
        }
        return NextResponse.next();
    }

    // Protected routes - redirect to login if not authenticated
    if (!isLoggedIn) {
        const loginUrl = new URL('/login', nextUrl);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection
    const role = session.user?.role;
    const roleRoutes = {
        '/tenant': ['TENANT'],
        '/landlord': ['LANDLORD'],
        '/scout': ['SCOUT'],
        '/affiliate': ['AFFILIATE'],
        '/admin': ['ADMIN'],
    };

    for (const [routePrefix, allowedRoles] of Object.entries(roleRoutes)) {
        if (pathname.startsWith(routePrefix) && !allowedRoles.includes(role)) {
            const userRoute = Object.entries(roleRoutes).find(([, roles]) => roles.includes(role));
            return NextResponse.redirect(new URL(userRoute?.[0] || '/', nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)'],
};
