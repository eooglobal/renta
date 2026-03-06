import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

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
                        scoutLead: true // Grab scout mapping if exists
                    }
                },
                escrow: true,
                affiliateReferral: true // Grab affiliate mapping if exists
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
                await prisma.$transaction(async (tx) => {
                    // 1. Release Escrow
                    const releasedEscrow = await tx.escrow.update({
                        where: { id: rental.escrow.id },
                        data: { status: 'RELEASED', releasedAt: new Date() },
                    });

                    // 2. Mark Rental Confirmed (Fallback mapping accessConfirmed if missing in schema)
                    // The schema shows status as RentalStatus (PENDING, ACTIVE, COMPLETED).
                    // Moving state to ACTIVE when tenant confirms access.
                    await tx.rental.update({
                        where: { id: rental.id },
                        data: { status: 'ACTIVE' },
                    });

                    // Utility to ensure a user has a wallet
                    const ensureWallet = async (userId) => {
                        let wallet = await tx.wallet.findUnique({ where: { userId } });
                        if (!wallet) {
                            wallet = await tx.wallet.create({ data: { userId, balance: 0, totalEarned: 0, totalWithdrawn: 0 } });
                        }
                        return wallet;
                    };

                    const rentAmountNum = Number(rental.rentAmount);

                    // 3. Payout to Landlord (100% of rent price)
                    const landlordWallet = await ensureWallet(rental.property.landlordId);
                    await tx.wallet.update({
                        where: { id: landlordWallet.id },
                        data: {
                            balance: { increment: rentAmountNum },
                            totalEarned: { increment: rentAmountNum }
                        }
                    });

                    await tx.transaction.create({
                        data: {
                            walletId: landlordWallet.id,
                            amount: rentAmountNum,
                            type: 'CREDIT',
                            description: `Rental payout for ${rental.property.title}`,
                            referenceId: String(releasedEscrow.id),
                            referenceType: 'ESCROW'
                        }
                    });

                    // Notify Landlord
                    createNotification(rental.property.landlordId, {
                        type: 'PAYMENT',
                        title: 'Funds Released!',
                        message: `₦${rentAmountNum.toLocaleString()} has been added to your wallet for ${rental.property.title}.`,
                        link: '/landlord/payments'
                    });

                    // 4. Payout to Scout (3% of rent price)
                    if (rental.property.scoutLead && rental.property.scoutLead.scoutId) {
                        const scoutAmount = rentAmountNum * 0.03;
                        const scoutWallet = await ensureWallet(rental.property.scoutLead.scoutId);

                        // Create Official Commission Record
                        const commission = await tx.commission.create({
                            data: {
                                escrowId: releasedEscrow.id,
                                userId: rental.property.scoutLead.scoutId,
                                type: 'SCOUT',
                                amount: scoutAmount,
                                percentage: 3.00,
                                status: 'PAID',
                                paidAt: new Date()
                            }
                        });

                        await tx.wallet.update({
                            where: { id: scoutWallet.id },
                            data: {
                                balance: { increment: scoutAmount },
                                totalEarned: { increment: scoutAmount }
                            }
                        });

                        await tx.transaction.create({
                            data: {
                                walletId: scoutWallet.id,
                                amount: scoutAmount,
                                type: 'CREDIT',
                                description: `Scout commission (3%) for ${rental.property.title}`,
                                referenceId: String(commission.id),
                                referenceType: 'COMMISSION'
                            }
                        });

                        // Notify Scout
                        createNotification(rental.property.scoutLead.scoutId, {
                            type: 'PAYMENT',
                            title: 'Commission Earned!',
                            message: `You earned ₦${scoutAmount.toLocaleString()} scout commission for ${rental.property.title}.`,
                            link: '/scout/earnings'
                        });
                    }

                    // 5. Payout to Affiliate (2% of rent price)
                    if (rental.affiliateReferral && rental.affiliateReferral.affiliateId) {
                        const affiliateAmount = rentAmountNum * 0.02;
                        const affiliateWallet = await ensureWallet(rental.affiliateReferral.affiliateId);

                        // Create Official Commission Record
                        const commission = await tx.commission.create({
                            data: {
                                escrowId: releasedEscrow.id,
                                userId: rental.affiliateReferral.affiliateId,
                                type: 'AFFILIATE',
                                amount: affiliateAmount,
                                percentage: 2.00,
                                status: 'PAID',
                                paidAt: new Date()
                            }
                        });

                        await tx.wallet.update({
                            where: { id: affiliateWallet.id },
                            data: {
                                balance: { increment: affiliateAmount },
                                totalEarned: { increment: affiliateAmount }
                            }
                        });

                        await tx.transaction.create({
                            data: {
                                walletId: affiliateWallet.id,
                                amount: affiliateAmount,
                                type: 'CREDIT',
                                description: `Affiliate commission (2%) for referral`,
                                referenceId: String(commission.id),
                                referenceType: 'COMMISSION'
                            }
                        });

                        // Notify Affiliate
                        createNotification(rental.affiliateReferral.affiliateId, {
                            type: 'PAYMENT',
                            title: 'Affiliate Commission!',
                            message: `You earned ₦${affiliateAmount.toLocaleString()} for a successful referral.`,
                            link: '/affiliate/earnings'
                        });
                    }
                });

                return NextResponse.json({
                    message: 'Access confirmed. Rent and commissions have been successfully deposited to the respective wallets.',
                    status: 'released',
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
                // Admin-only action to force release
                if (!isAdmin) {
                    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
                }

                if (rental.escrow) {
                    await prisma.escrow.update({
                        where: { id: rental.escrow.id },
                        data: { status: 'RELEASED', releasedAt: new Date() },
                    });
                }

                return NextResponse.json({
                    message: 'Escrow released by admin.',
                    status: 'released',
                });
            }

            case 'admin_refund': {
                // Admin-only refund
                if (!isAdmin) {
                    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
                }

                if (rental.escrow) {
                    await prisma.escrow.update({
                        where: { id: rental.escrow.id },
                        data: { status: 'REFUNDED', releasedAt: new Date() },
                    });
                }

                await prisma.rental.update({
                    where: { id: rental.id },
                    data: { status: 'CANCELLED' },
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
