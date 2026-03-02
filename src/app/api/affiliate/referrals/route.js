import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'AFFILIATE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const affiliateId = parseInt(session.user.id);

        const referrals = await prisma.affiliateReferral.findMany({
            where: { affiliateId },
            include: {
                referredUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        createdAt: true,
                        // Let's also see if they have rented (active rentals)
                        rentals: {
                            where: { status: 'ACTIVE' },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(referrals);
    } catch (error) {
        console.error('Failed to fetch referrals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
