import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { generatePropertySlug } from '@/lib/slugs';

// GET /api/properties — List properties with filters
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const cityId = searchParams.get('cityId');
        const areaId = searchParams.get('areaId');
        const type = searchParams.get('type');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const search = searchParams.get('search');
        const verified = searchParams.get('verified');
        const studentFriendly = searchParams.get('studentFriendly');
        const status = searchParams.get('status');
        const landlordId = searchParams.get('landlordId');

        // Build where clause
        const where = {};

        // Public listings only show verified properties by default
        if (!landlordId) {
            where.status = 'VERIFIED';
        }

        if (landlordId) {
            where.landlordId = parseInt(landlordId);
        }

        if (status) {
            where.status = status;
        }

        if (cityId) {
            where.cityId = parseInt(cityId);
        }

        if (areaId) {
            where.areaId = parseInt(areaId);
        }

        if (type) {
            where.type = type;
        }

        if (minPrice || maxPrice) {
            where.rentPrice = {};
            if (minPrice) where.rentPrice.gte = parseFloat(minPrice);
            if (maxPrice) where.rentPrice.lte = parseFloat(maxPrice);
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { address: { contains: search } },
            ];
        }

        if (verified === 'true') {
            where.verificationStatus = 'VERIFIED';
        }

        if (studentFriendly === 'true') {
            where.studentFriendly = true;
        }

        const skip = (page - 1) * limit;

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    landlord: {
                        select: { id: true, firstName: true, lastName: true, ninStatus: true },
                    },
                },
                orderBy: [
                    { isFeatured: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit,
            }),
            prisma.property.count({ where }),
        ]);

        const response = NextResponse.json({
            properties,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });

        // Add caching for public searches (60 seconds)
        if (!landlordId) {
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        }

        return response;
    } catch (error) {
        console.error('Properties list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch properties' },
            { status: 500 }
        );
    }
}

// POST /api/properties — Create a new property (landlord only)
export async function POST(request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'LANDLORD') {
            return NextResponse.json(
                { error: 'Only landlords can list properties' },
                { status: 403 }
            );
        }

        // --- Rate Limiting ---
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { checkRateLimit } = await import('@/lib/rate-limiter');
        // Max 5 properties per 10 minutes
        const rateLimit = await checkRateLimit(`${ip}-${session.user.id}`, 'create_property', 5, 10 * 60 * 1000);

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: rateLimit.message },
                { status: 429 }
            );
        }

        // Verify the user exists in the database to prevent foreign key violations with stale sessions
        const dbUser = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) }
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: 'Session expired or user not found. Please log out and log back in.' },
                { status: 401 }
            );
        }

        // Validation using Zod
        const { propertyCreationSchema } = await import('@/lib/validations');
        const validationResult = propertyCreationSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid data format', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const {
            title, description, rentPrice, type, address, cityId, areaId,
            latitude, longitude, amenities, studentFriendly,
            uploadLatitude, uploadLongitude
        } = validationResult.data;

        const validTypes = ['SELF_CON', 'SINGLE_ROOM', 'FLAT', 'TWO_BEDROOM', 'THREE_BEDROOM'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid property type' },
                { status: 400 }
            );
        }

        // Verify that the area belongs to the city
        const areaExists = await prisma.area.findUnique({
            where: { id: parseInt(areaId) },
            include: { city: true }
        });

        if (!areaExists || areaExists.cityId !== parseInt(cityId)) {
            return NextResponse.json(
                { error: 'Invalid city or area selection' },
                { status: 400 }
            );
        }

        // --- Geofencing Validation (Fraud Prevention) ---
        let initialVerificationStatus = 'UNVERIFIED';
        let geoDistance = null;

        if (uploadLatitude && uploadLongitude && areaExists) {
            const { calculateHaversineDistance } = await import('@/lib/geoUtils');
            const targetCoords = {
                lat: parseFloat(areaExists.latitude),
                lon: parseFloat(areaExists.longitude)
            };

            if (targetCoords.lat && targetCoords.lon) {
                geoDistance = calculateHaversineDistance(
                    uploadLatitude, uploadLongitude,
                    targetCoords.lat, targetCoords.lon
                );

                // If uploaded > 10km from the declared area center, flag as suspicious
                if (geoDistance > 10) {
                    console.log(`[FRAUD ALERT] User ${session.user.id} uploaded property in ${areaExists.name} from ${geoDistance.toFixed(2)}km away.`);
                    initialVerificationStatus = 'SUSPICIOUS';
                }
            }
        } else if (!uploadLatitude) {
            // No location provided (denied permissions or unsupported browser)
            // We flag it for closer manual inspection
            initialVerificationStatus = 'SUSPICIOUS';
        }

        // --- Rapid Creation Fraud Check ---
        const { checkRapidPropertyCreation } = await import('@/lib/fraudRules');
        const isFraudulent = await checkRapidPropertyCreation(session.user.id);
        if (isFraudulent) {
            return NextResponse.json(
                { error: 'Account suspended due to suspicious activity (Rate Limit Exceeded).' },
                { status: 403 }
            );
        }

        const property = await prisma.property.create({
            data: {
                landlordId: parseInt(session.user.id),
                title,
                description,
                rentPrice,
                type,
                address,
                cityId: parseInt(cityId),
                areaId: parseInt(areaId),
                latitude: latitude || null,
                longitude: longitude || null,
                amenities: JSON.stringify(amenities || []),
                studentFriendly: studentFriendly || false,
                status: 'PENDING',
                verificationStatus: initialVerificationStatus,
                slug: generatePropertySlug(title, areaExists.city.name, areaExists.name),
            },
            include: {
                images: true,
            },
        });

        return NextResponse.json(
            { message: 'Property created successfully. Pending verification.', property, geoDistance },
            { status: 201 }
        );
    } catch (error) {
        console.error('Property create error:', error);
        return NextResponse.json(
            { error: `Failed to create property: ${error.message}` },
            { status: 500 }
        );
    }
}
