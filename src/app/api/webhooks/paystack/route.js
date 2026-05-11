import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/paystack';

// POST /api/webhooks/paystack — Handle Paystack webhook
export async function POST(request) {
    try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        const signature = request.headers.get('x-paystack-signature');

        // Validate webhook signature
        if (!(await validateWebhookSignature(rawBody, signature))) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        switch (event) {
            case 'charge.success': {
                const reference = data.reference;

                // Route based on payment type — mutually exclusive paths
                if (data.metadata?.type === 'FEATURE_LISTING') {
                    // ── Featured Listing Payment ──
                    const propertyId = data.metadata.propertyId;

                    // Set featured expiry to 7 days from now
                    const featuredUntil = new Date();
                    featuredUntil.setDate(featuredUntil.getDate() + 7);

                    await prisma.property.update({
                        where: { id: propertyId }, // Property ID is a string (CUID)
                        data: {
                            isFeatured: true,
                            featuredUntil: featuredUntil
                        }
                    });
                    console.log(`Property ${propertyId} featured successfully via webhook.`);

                } else {
                    // ── Rental Payment ──
                    const payment = await prisma.payment.findFirst({
                        where: { paystackRef: reference },
                        include: { rental: true },
                    });

                    if (payment && payment.status !== 'SUCCESS') {
                        // Atomic: all rental state changes succeed or fail together
                        await prisma.$transaction(async (tx) => {
                            await tx.payment.update({
                                where: { id: payment.id },
                                data: {
                                    status: 'SUCCESS',
                                    paidAt: new Date(data.paid_at),
                                },
                            });

                            await tx.rental.update({
                                where: { id: payment.rentalId },
                                data: { status: 'ACTIVE' },
                            });

                            // Update corresponding property to RENTED
                            await tx.property.update({
                                where: { id: payment.rental.propertyId },
                                data: { status: 'RENTED' }
                            });

                            // Set Escrow status to HELD
                            const escrow = await tx.escrow.findFirst({
                                where: { rentalId: payment.rentalId }
                            });
                            if (escrow) {
                                await tx.escrow.update({
                                    where: { id: escrow.id },
                                    data: { status: 'HELD' }
                                });
                            }
                        });
                    }
                }
                break;
            }

            case 'transfer.success': {
                // Handle successful transfer to landlord/user
                const reference = data.reference;
                const withdrawalId = parseInt(reference);

                if (!isNaN(withdrawalId)) {
                    await prisma.$transaction(async (tx) => {
                        const withdrawal = await tx.withdrawalRequest.findUnique({
                            where: { id: withdrawalId },
                            include: { wallet: { include: { user: true } } }
                        });

                        if (withdrawal && withdrawal.status !== 'PROCESSED') {
                            await tx.withdrawalRequest.update({
                                where: { id: withdrawalId },
                                data: {
                                    status: 'PROCESSED',
                                    processedAt: new Date(),
                                }
                            });

                            // Increment totalWithdrawn tracker
                            await tx.wallet.update({
                                where: { id: withdrawal.walletId },
                                data: {
                                    totalWithdrawn: { increment: withdrawal.amount }
                                }
                            });

                            // Notify user
                            try {
                                const { createNotification } = await import('@/lib/notifications');
                                await createNotification(withdrawal.wallet.userId, {
                                    type: 'PAYMENT',
                                    title: 'Payout Successful',
                                    message: `Your withdrawal of ₦${Number(withdrawal.amount).toLocaleString()} has been processed successfully to your bank account.`,
                                    link: '/tenant/wallet' // General link
                                });
                            } catch (notifErr) {
                                console.error('Webhook notification error:', notifErr);
                            }
                        }
                    });
                }
                console.log('Transfer successful:', reference);
                break;
            }

            case 'transfer.failed': {
                // Handle failed transfer — refund the user
                const reference = data.reference;
                const withdrawalId = parseInt(reference);

                if (!isNaN(withdrawalId)) {
                    await prisma.$transaction(async (tx) => {
                        const withdrawal = await tx.withdrawalRequest.findUnique({
                            where: { id: withdrawalId },
                            include: { wallet: { include: { user: true } } }
                        });

                        if (withdrawal && withdrawal.status !== 'REJECTED' && withdrawal.status !== 'FAILED') {
                            await tx.withdrawalRequest.update({
                                where: { id: withdrawalId },
                                data: {
                                    status: 'FAILED',
                                    adminNotes: `Paystack transfer failed: ${data.reason || 'Unknown reason'}`
                                }
                            });

                            // Refund the balance
                            await tx.wallet.update({
                                where: { id: withdrawal.walletId },
                                data: {
                                    balance: { increment: withdrawal.amount }
                                }
                            });

                            // Create refund transaction
                            await tx.transaction.create({
                                data: {
                                    walletId: withdrawal.walletId,
                                    amount: withdrawal.amount,
                                    type: 'CREDIT',
                                    description: `Refund for failed transfer: ${reference}`,
                                    referenceId: String(withdrawalId),
                                    referenceType: 'WITHDRAWAL_REFUND'
                                }
                            });

                            // Notify user
                            try {
                                const { createNotification } = await import('@/lib/notifications');
                                await createNotification(withdrawal.wallet.userId, {
                                    type: 'PAYMENT',
                                    title: 'Payout Failed',
                                    message: `Your withdrawal of ₦${Number(withdrawal.amount).toLocaleString()} failed. The funds have been returned to your wallet.`,
                                    link: '/tenant/wallet'
                                });
                            } catch (notifErr) {
                                console.error('Webhook notification error:', notifErr);
                            }
                        }
                    });
                }
                console.log('Transfer failed:', reference);
                break;
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
