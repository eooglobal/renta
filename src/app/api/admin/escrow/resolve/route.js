import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await auth();

        // Authorization: Only ADMIN or VERIFICATION_OFFICER can resolve disputes
        if (!session || (session.user.role !== 'ADMIN' && session.user.adminRole !== 'VERIFICATION_OFFICER')) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { escrowId, action } = body;

        if (!escrowId || !action) {
            return NextResponse.json({ error: 'Missing defined escrowId or action.' }, { status: 400 });
        }

        if (action !== 'RELEASE' && action !== 'REFUND') {
            return NextResponse.json({ error: 'Invalid action. Must be RELEASE or REFUND.' }, { status: 400 });
        }

        // Fetch the escrow to ensure it exists and is currently DISPUTED or HELD
        const escrow = await prisma.escrow.findUnique({
            where: { id: parseInt(escrowId) },
            include: {
                rental: {
                    select: { tenantId: true, property: { select: { landlordId: true } } }
                }
            }
        });

        if (!escrow) {
            return NextResponse.json({ error: 'Escrow record not found.' }, { status: 404 });
        }

        if (escrow.status === 'RELEASED' || escrow.status === 'REFUNDED') {
            return NextResponse.json({ error: `Escrow has already been ${escrow.status.toLowerCase()}.` }, { status: 400 });
        }

        // Execute transaction to resolve escrow and update relevant wallets
        const result = await prisma.$transaction(async (tx) => {
            let updatedEscrow;

            if (action === 'RELEASE') {
                // Admin decides Landlord gets the money (complaint invalid)
                updatedEscrow = await tx.escrow.update({
                    where: { id: parseInt(escrowId) },
                    data: {
                        status: 'RELEASED',
                        releasedAt: new Date(),
                        releasedById: parseInt(session.user.id),
                        disputeReason: escrow.disputeReason ? `${escrow.disputeReason}\n[ADMIN ${session.user.id}]: Released to Landlord.` : `[ADMIN ${session.user.id}]: Released to Landlord.`
                    }
                });

                // Credit the Landlord's wallet
                const landlordId = escrow.rental.property.landlordId;

                // Ensure landlord wallet exists
                let landlordWallet = await tx.wallet.findUnique({ where: { userId: landlordId } });
                if (!landlordWallet) {
                    landlordWallet = await tx.wallet.create({ data: { userId: landlordId } });
                }

                await tx.wallet.update({
                    where: { id: landlordWallet.id },
                    data: {
                        balance: { increment: escrow.amount },
                        totalEarned: { increment: escrow.amount }
                    }
                });

                // Record Transaction
                await tx.transaction.create({
                    data: {
                        walletId: landlordWallet.id,
                        amount: escrow.amount,
                        type: 'CREDIT',
                        description: `Dispute Resolution: Rent released for escrow #${escrow.id}`,
                        referenceId: String(escrow.id),
                        referenceType: 'ESCROW_RELEASE'
                    }
                });

            } else if (action === 'REFUND') {
                // Admin decides Tenant gets the money back (complaint valid)
                updatedEscrow = await tx.escrow.update({
                    where: { id: parseInt(escrowId) },
                    data: {
                        status: 'REFUNDED',
                        releasedAt: new Date(),
                        releasedById: parseInt(session.user.id),
                        disputeReason: escrow.disputeReason ? `${escrow.disputeReason}\n[ADMIN ${session.user.id}]: Refunded to Tenant.` : `[ADMIN ${session.user.id}]: Refunded to Tenant.`
                    }
                });

                // Credit the Tenant's wallet (so they can withdraw or use it elsewhere)
                const tenantId = escrow.rental.tenantId;

                // Ensure tenant wallet exists
                let tenantWallet = await tx.wallet.findUnique({ where: { userId: tenantId } });
                if (!tenantWallet) {
                    tenantWallet = await tx.wallet.create({ data: { userId: tenantId } });
                }

                await tx.wallet.update({
                    where: { id: tenantWallet.id },
                    data: {
                        balance: { increment: escrow.amount },
                        // Notice: we do NOT increment totalEarned because it's a refund, not earnings
                    }
                });

                // Record Transaction
                await tx.transaction.create({
                    data: {
                        walletId: tenantWallet.id,
                        amount: escrow.amount,
                        type: 'CREDIT',
                        description: `Dispute Resolution: Rent refunded for escrow #${escrow.id}`,
                        referenceId: String(escrow.id),
                        referenceType: 'ESCROW_REFUND'
                    }
                });
            }

            return updatedEscrow;
        });

        return NextResponse.json({ message: `Dispute successfully resolved. Escrow ${action.toLowerCase()}ed.`, escrow: result }, { status: 200 });

    } catch (error) {
        console.error('Error resolving dispute:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
