import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Fetch current user's rentals
export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rentals = await prisma.rental.findMany({
            where: { tenantId: parseInt(session.user.id) },
            include: {
                property: {
                    select: {
                        title: true,
                        address: true,
                        area: true,
                        type: true,
                        images: { take: 1, where: { isPrimary: true } }
                    }
                },
                escrow: { select: { status: true } },
                agreement: { select: { tenantSigned: true, landlordSigned: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rentals);
    } catch (error) {
        console.error('Error fetching rentals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
