import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { distributeEscrowFunds } from '@/lib/distributeEscrowFunds';
import { createNotification } from '@/lib/notifications';

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
            return NextResponse.json({ error: 'Missing escrowId or action.' }, { status: 400 });
        }

        if (action !== 'RELEASE' && action !== 'REFUND') {
            return NextResponse.json({ error: 'Invalid action. Must be RELEASE or REFUND.' }, { status: 400 });
        }

        // Fetch escrow with all relations needed for fund distribution
        const escrow = await prisma.escrow.findUnique({
            where: { id: parseInt(escrowId) },
            include: {
                rental: {
                    include: {
                        tenant: true,
                        property: {
                            include: {
                                landlord: true,
                                scoutLead: true
                            }
                        },
                        affiliateReferral: true
                    }
                }
            }
        });

        if (!escrow) {
            return NextResponse.json({ error: 'Escrow record not found.' }, { status: 404 });
        }

        if (escrow.status === 'RELEASED' || escrow.status === 'REFUNDED') {
            return NextResponse.json({ error: `Escrow has already been ${escrow.status.toLowerCase()}.` }, { status: 400 });
        }

        if (action === 'RELEASE') {
            // Admin decides Landlord gets the money — distribute properly
            const distribution = await prisma.$transaction(async (tx) => {
                const updatedEscrow = await tx.escrow.update({
                    where: { id: parseInt(escrowId) },
                    data: {
                        status: 'RELEASED',
                        releasedAt: new Date(),
                        releasedById: parseInt(session.user.id),
                        disputeReason: escrow.disputeReason
                            ? `${escrow.disputeReason}\n[ADMIN ${session.user.id}]: Released to Landlord.`
                            : `[ADMIN ${session.user.id}]: Released to Landlord.`
                    }
                });

                // Distribute funds to landlord, scout, affiliate, and platform
                return await distributeEscrowFunds(tx, escrow.rental, updatedEscrow);
            });

            return NextResponse.json({
                message: 'Dispute resolved. Funds distributed to landlord and commissions paid.',
                distribution,
            }, { status: 200 });

        } else if (action === 'REFUND') {
            // Admin decides Tenant gets the money back — credit tenant's wallet
            await prisma.$transaction(async (tx) => {
                await tx.escrow.update({
                    where: { id: parseInt(escrowId) },
                    data: {
                        status: 'REFUNDED',
                        releasedAt: new Date(),
                        releasedById: parseInt(session.user.id),
                        disputeReason: escrow.disputeReason
                            ? `${escrow.disputeReason}\n[ADMIN ${session.user.id}]: Refunded to Tenant.`
                            : `[ADMIN ${session.user.id}]: Refunded to Tenant.`
                    }
                });

                // Credit the tenant's wallet with the full amount paid
                const totalPaid = Number(escrow.rental.totalPaid);
                const tenantId = escrow.rental.tenantId;

                let tenantWallet = await tx.wallet.findUnique({ where: { userId: tenantId } });
                if (!tenantWallet) {
                    tenantWallet = await tx.wallet.create({
                        data: { userId: tenantId, balance: 0, totalEarned: 0, totalWithdrawn: 0 }
                    });
                }

                await tx.wallet.update({
                    where: { id: tenantWallet.id },
                    data: { balance: { increment: totalPaid } }
                });

                await tx.transaction.create({
                    data: {
                        walletId: tenantWallet.id,
                        amount: totalPaid,
                        type: 'CREDIT',
                        description: `Dispute Resolution: Rent refunded for escrow #${escrow.id}`,
                        referenceId: String(escrow.id),
                        referenceType: 'ESCROW_REFUND'
                    }
                });

                // Cancel the rental and make property available again
                await tx.rental.update({
                    where: { id: escrow.rental.id },
                    data: { status: 'CANCELLED' }
                });

                await tx.property.update({
                    where: { id: escrow.rental.propertyId },
                    data: { status: 'VERIFIED' }
                });
            });

            createNotification(escrow.rental.tenantId, {
                type: 'PAYMENT',
                title: 'Refund Processed',
                message: `₦${Number(escrow.rental.totalPaid).toLocaleString()} has been refunded to your wallet.`,
                link: '/tenant/wallet'
            });

            return NextResponse.json({
                message: 'Dispute resolved. Full amount refunded to tenant.',
            }, { status: 200 });
        }

    } catch (error) {
        console.error('Error resolving dispute:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
