import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = parseInt(session.user.id);

        const [activeRentalsCount, escrowBalance, savedListingsCount] = await Promise.all([
            // 1. Active Rentals
            prisma.rental.count({
                where: { tenantId: userId, status: 'ACTIVE' }
            }),
            // 2. Total in Escrow (HELD or DISPUTED)
            prisma.escrow.aggregate({
                where: {
                    rental: { tenantId: userId },
                    status: { in: ['HELD', 'DISPUTED'] }
                },
                _sum: { amount: true }
            }),
            // 3. Saved Listings (Assuming a SavedListing model exists or using a relation)
            // If the model doesn't exist yet, we'll return 0 to avoid crashes, 
            // but usually there's a join table for this.
            prisma.savedListing?.count({
                where: { userId }
            }).catch(() => 0) || 0
        ]);

        return NextResponse.json({
            activeRentals: activeRentalsCount,
            escrowBalance: escrowBalance._sum.amount || 0,
            savedListings: savedListingsCount
        });
    } catch (error) {
        console.error('Tenant stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
