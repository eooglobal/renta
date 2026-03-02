import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        const session = await auth();

        // Authorization: Only tenants can dispute escrows
        if (!session || session.user.role !== 'TENANT') {
            return NextResponse.json({ error: 'Unauthorized. Only tenants can initiate disputes.' }, { status: 403 });
        }

        const escrowId = params.id;
        const body = await request.json();
        const { reason } = body;

        if (!reason || reason.trim().length < 10) {
            return NextResponse.json({ error: 'A detailed reason (at least 10 characters) is required to open a dispute.' }, { status: 400 });
        }

        // Verify the escrow belongs to this tenant and is currently HELD
        const escrow = await prisma.escrow.findUnique({
            where: { id: parseInt(escrowId) },
            include: {
                rental: true
            }
        });

        if (!escrow) {
            return NextResponse.json({ error: 'Escrow record not found.' }, { status: 404 });
        }

        if (escrow.rental.tenantId !== parseInt(session.user.id)) {
            return NextResponse.json({ error: 'Unauthorized. This escrow belongs to a different tenant.' }, { status: 403 });
        }

        if (escrow.status !== 'HELD') {
            return NextResponse.json({ error: `Cannot dispute. Escrow is currently in ${escrow.status} state.` }, { status: 400 });
        }

        // Update the Escrow to DISPUTED and log the reason
        const updatedEscrow = await prisma.escrow.update({
            where: { id: parseInt(escrowId) },
            data: {
                status: 'DISPUTED',
                disputeReason: reason,
                // We clear the autoReleaseAt to ensure cron jobs don't release it
                autoReleaseAt: null
            }
        });

        // Also update the underlying rental status for clarity
        await prisma.rental.update({
            where: { id: escrow.rental.id },
            data: { status: 'DISPUTED' }
        });

        return NextResponse.json({
            message: 'Dispute filed successfully. Support will contact you shortly.',
            escrow: updatedEscrow
        }, { status: 200 });

    } catch (error) {
        console.error('Error creating dispute:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
