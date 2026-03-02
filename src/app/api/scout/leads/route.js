import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'SCOUT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scoutId = parseInt(session.user.id);

        const leads = await prisma.scoutLead.findMany({
            where: { scoutId },
            orderBy: { createdAt: 'desc' },
            include: {
                properties: { select: { id: true, title: true, status: true, verificationStatus: true } }
            }
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error('Failed to fetch scout leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        // Allow SCOUT or ADMIN to submit leads (admins can submit on behalf of a scout if needed)
        if (!session || (session.user.role !== 'SCOUT' && session.user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scoutId = parseInt(session.user.id);
        const body = await request.json();
        const { landlordName, landlordPhone, propertyAddress, propertyArea, notes, latitude, longitude } = body;

        // Basic validation
        if (!landlordName || !landlordPhone || !propertyAddress || !propertyArea) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the lead
        const lead = await prisma.scoutLead.create({
            data: {
                scoutId,
                landlordName,
                landlordPhone,
                propertyAddress,
                propertyArea,
                latitude: latitude || null,
                longitude: longitude || null,
                notes,
                status: 'SUBMITTED'
            }
        });

        // If location is provided, we can optionally run a quick distance check
        // and log it, though for Scouts, the "verification" step handles the final verdict.
        if (latitude && longitude && propertyArea !== 'OTHER') {
            const { calculateHaversineDistance, AREA_COORDINATES } = await import('@/lib/geoUtils');
            const targetCoords = AREA_COORDINATES[propertyArea.toUpperCase()];
            if (targetCoords) {
                const geoDistance = calculateHaversineDistance(
                    latitude, longitude, targetCoords.lat, targetCoords.lon
                );
                console.log(`[SCOUT LOCATION LOG] Scout ${scoutId} submitted lead for ${propertyArea} from ${geoDistance.toFixed(2)}km away.`);
            }
        }

        return NextResponse.json({ message: 'Lead submitted successfully', data: lead }, { status: 201 });
    } catch (error) {
        console.error('Failed to submit scout lead:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
