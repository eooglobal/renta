import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session;
    const pathname = nextUrl.pathname;

    // Public routes that don't need auth
    const publicRoutes = ['/', '/login', '/register', '/listings', '/about', '/contact', '/terms'];
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
