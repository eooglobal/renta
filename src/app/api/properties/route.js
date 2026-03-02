import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/properties — List properties with filters
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const area = searchParams.get('area');
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

        if (area) {
            where.area = area.toUpperCase();
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.property.count({ where }),
        ]);

        return NextResponse.json({
            properties,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
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
                { error: 'Only landlords can create properties' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            title, description, rentPrice, type, address, area,
            latitude, longitude, amenities, studentFriendly,
            uploadLatitude, uploadLongitude
        } = body;

        // Validation
        if (!title || !description || !rentPrice || !type || !address || !area) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        if (rentPrice <= 0) {
            return NextResponse.json(
                { error: 'Rent price must be greater than zero' },
                { status: 400 }
            );
        }

        const validTypes = ['SELF_CON', 'SINGLE_ROOM', 'FLAT', 'TWO_BEDROOM', 'THREE_BEDROOM'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid property type' },
                { status: 400 }
            );
        }

        const validAreas = ['TANKE', 'BASIN', 'MALETE', 'OTHER'];
        if (!validAreas.includes(area.toUpperCase())) {
            return NextResponse.json(
                { error: 'Invalid area. Must be Tanke, Basin, Malete, or Other' },
                { status: 400 }
            );
        }

        // --- Geofencing Validation (Fraud Prevention) ---
        let initialVerificationStatus = 'UNVERIFIED';
        let geoDistance = null;

        if (uploadLatitude && uploadLongitude && area !== 'OTHER') {
            const { calculateHaversineDistance, AREA_COORDINATES } = await import('@/lib/geoUtils');
            const targetCoords = AREA_COORDINATES[area.toUpperCase()];

            if (targetCoords) {
                geoDistance = calculateHaversineDistance(
                    uploadLatitude, uploadLongitude,
                    targetCoords.lat, targetCoords.lon
                );

                // If uploaded > 5km from the declared area, flag as suspicious
                if (geoDistance > 5) {
                    console.log(`[FRAUD ALERT] User ${session.user.id} uploaded property in ${area} from ${geoDistance.toFixed(2)}km away.`);
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
                area: area.toUpperCase(),
                latitude: latitude || null,
                longitude: longitude || null,
                amenities: amenities || [],
                studentFriendly: studentFriendly || false,
                status: 'PENDING',
                verificationStatus: initialVerificationStatus,
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
            { error: 'Failed to create property' },
            { status: 500 }
        );
    }
}
