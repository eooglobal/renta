import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// POST /api/admin/maintenance/cleanup — Cleanup stale PENDING rentals
export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find all pending rentals older than 24 hours
        const staleRentals = await prisma.rental.findMany({
            where: {
                status: 'PENDING',
                createdAt: {
                    lt: twentyFourHoursAgo,
                },
            },
            include: {
                escrow: true,
                payments: true,
            },
        });

        if (staleRentals.length === 0) {
            return NextResponse.json({ message: 'No stale rentals found' });
        }

        const deletedCount = await prisma.$transaction(async (tx) => {
            let count = 0;
            for (const rental of staleRentals) {
                // Delete associated records first due to constraints if not handled by Cascade
                // Based on schema, escrow and payments relate to rental.
                // RentalAgreement also relates to rental.
                
                await tx.payment.deleteMany({ where: { rentalId: rental.id } });
                await tx.escrow.deleteMany({ where: { rentalId: rental.id } });
                await tx.rentalAgreement.deleteMany({ where: { rentalId: rental.id } });
                await tx.rental.delete({ where: { id: rental.id } });
                count++;
            }
            return count;
        });

        return NextResponse.json({
            message: `Successfully cleaned up ${deletedCount} stale rentals.`,
            count: deletedCount,
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Failed to perform cleanup' }, { status: 500 });
    }
}
