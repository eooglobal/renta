import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { distributeEscrowFunds } from '@/lib/distributeEscrowFunds';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { rentalId, action } = body;

        if (!rentalId || !action) {
            return NextResponse.json({ error: 'Rental ID and action required' }, { status: 400 });
        }

        const rental = await prisma.rental.findUnique({
            where: { id: rentalId },
            include: {
                tenant: true,
                property: {
                    include: {
                        landlord: true,
                        scoutLead: true
                    }
                },
                escrow: true,
                affiliateReferral: true
            },
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        const isTenant = rental.tenantId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'ADMIN';

        switch (action) {
            case 'confirm_access': {
                if (!isTenant) {
                    return NextResponse.json({ error: 'Only the tenant can confirm access' }, { status: 403 });
                }

                if (!rental.escrow || rental.escrow.status !== 'HELD') {
                    return NextResponse.json({ error: 'No escrow to release' }, { status: 400 });
                }

                // SECURE TRANSACTION: All or nothing DB updates
                const distribution = await prisma.$transaction(async (tx) => {
                    // 1. Release Escrow
                    const releasedEscrow = await tx.escrow.update({
                        where: { id: rental.escrow.id },
                        data: { status: 'RELEASED', releasedAt: new Date() },
                    });

                    // 2. Mark Rental as ACTIVE
                    await tx.rental.update({
                        where: { id: rental.id },
                        data: { status: 'ACTIVE' },
                    });

                    // 3. Distribute funds to all parties
                    return await distributeEscrowFunds(tx, rental, releasedEscrow);
                });

                return NextResponse.json({
                    message: 'Access confirmed. Rent and commissions distributed.',
                    status: 'released',
                    distribution,
                });
            }

            case 'dispute': {
                if (!isTenant && !isAdmin) {
                    return NextResponse.json({ error: 'Not authorized for disputes' }, { status: 403 });
                }

                if (rental.escrow) {
                    await prisma.escrow.update({
                        where: { id: rental.escrow.id },
                        data: { status: 'DISPUTED' },
                    });
                }

                await prisma.rental.update({
                    where: { id: rental.id },
                    data: { status: 'DISPUTED' },
                });

                return NextResponse.json({
                    message: 'Dispute raised. Funds will remain in escrow until resolved.',
                    status: 'disputed',
                });
            }

            case 'admin_release': {
                if (!isAdmin) {
                    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
                }

                if (!rental.escrow || (rental.escrow.status !== 'HELD' && rental.escrow.status !== 'DISPUTED')) {
                    return NextResponse.json({ error: 'No escrow available to release' }, { status: 400 });
                }

                const distribution = await prisma.$transaction(async (tx) => {
                    // Release escrow
                    const releasedEscrow = await tx.escrow.update({
                        where: { id: rental.escrow.id },
                        data: {
                            status: 'RELEASED',
                            releasedAt: new Date(),
                            releasedById: parseInt(session.user.id),
                        },
                    });

                    // Distribute funds to all parties
                    return await distributeEscrowFunds(tx, rental, releasedEscrow);
                });

                return NextResponse.json({
                    message: 'Escrow released by admin. Funds distributed.',
                    status: 'released',
                    distribution,
                });
            }

            case 'admin_refund': {
                if (!isAdmin) {
                    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
                }

                if (rental.escrow) {
                    await prisma.escrow.update({
                        where: { id: rental.escrow.id },
                        data: { status: 'REFUNDED', releasedAt: new Date() },
                    });
                }

                // Refund the tenant's wallet
                const totalPaidNum = Number(rental.totalPaid);
                const tenantWallet = await prisma.wallet.upsert({
                    where: { userId: rental.tenantId },
                    update: { balance: { increment: totalPaidNum } },
                    create: { userId: rental.tenantId, balance: totalPaidNum, totalEarned: 0, totalWithdrawn: 0 },
                });

                await prisma.transaction.create({
                    data: {
                        walletId: tenantWallet.id,
                        amount: totalPaidNum,
                        type: 'CREDIT',
                        description: `Refund for ${rental.property.title}`,
                        referenceId: String(rental.escrow?.id || rental.id),
                        referenceType: 'ESCROW_REFUND'
                    }
                });

                await prisma.rental.update({
                    where: { id: rental.id },
                    data: { status: 'CANCELLED' },
                });

                // Make property available again
                await prisma.property.update({
                    where: { id: rental.propertyId },
                    data: { status: 'VERIFIED' },
                });

                createNotification(rental.tenantId, {
                    type: 'PAYMENT',
                    title: 'Refund Processed',
                    message: `₦${totalPaidNum.toLocaleString()} has been refunded to your wallet for ${rental.property.title}.`,
                    link: '/tenant/wallet'
                });

                return NextResponse.json({
                    message: 'Escrow refunded to tenant.',
                    status: 'refunded',
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Escrow action error:', error);
        return NextResponse.json({ error: 'Failed to process escrow action' }, { status: 500 });
    }
}
