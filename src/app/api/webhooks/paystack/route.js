import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/paystack';
import { applyRentalPaymentSuccess } from '@/lib/rentalPaymentSuccess';
import { dispatchRentalPaidNotifications } from '@/lib/notificationDispatcher';

async function notifyWithdrawal(userId, notification) {
    try {
        const { createNotification } = await import('@/lib/notifications');
        await createNotification(userId, notification);
    } catch (notifErr) {
        console.error('Webhook notification error:', notifErr);
    }
}

async function handleFeaturedListing(data) {
    const propertyId = data.metadata.propertyId;
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + 7);

    await prisma.property.update({
        where: { id: propertyId },
        data: {
            isFeatured: true,
            featuredUntil,
        },
    });
}

async function handleRentalChargeSuccess(data) {
    const payment = await prisma.payment.findFirst({
        where: { paystackRef: data.reference },
        include: {
            rental: {
                include: {
                    tenant: true,
                    property: { include: { landlord: true } },
                    escrow: true,
                },
            },
        },
    });

    if (payment && payment.status !== 'SUCCESS') {
        await prisma.$transaction(async (tx) => {
            await applyRentalPaymentSuccess(tx, { payment, paymentData: data });
        });
    }
}

async function handleTransferSuccess(data) {
    const withdrawalId = parseInt(data.reference, 10);
    if (Number.isNaN(withdrawalId)) return;

    await prisma.$transaction(async (tx) => {
        const withdrawal = await tx.withdrawalRequest.findUnique({
            where: { id: withdrawalId },
            include: { wallet: { include: { user: true } } },
        });

        if (!withdrawal || withdrawal.status === 'PROCESSED') return;

        await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
                status: 'PROCESSED',
                processedAt: new Date(),
            },
        });

        await tx.wallet.update({
            where: { id: withdrawal.walletId },
            data: {
                totalWithdrawn: { increment: withdrawal.amount },
            },
        });

        await notifyWithdrawal(withdrawal.wallet.userId, {
            type: 'PAYMENT',
            title: 'Payout Successful',
            message: `Your withdrawal of NGN ${Number(withdrawal.amount).toLocaleString()} has been processed successfully to your bank account.`,
            link: '/tenant/wallet',
        });
    });
}

async function handleTransferFailed(data) {
    const withdrawalId = parseInt(data.reference, 10);
    if (Number.isNaN(withdrawalId)) return;

    await prisma.$transaction(async (tx) => {
        const withdrawal = await tx.withdrawalRequest.findUnique({
            where: { id: withdrawalId },
            include: { wallet: { include: { user: true } } },
        });

        if (!withdrawal || withdrawal.status === 'REJECTED' || withdrawal.status === 'FAILED') return;

        await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
                status: 'FAILED',
                adminNotes: `Paystack transfer failed: ${data.reason || 'Unknown reason'}`,
            },
        });

        await tx.wallet.update({
            where: { id: withdrawal.walletId },
            data: {
                balance: { increment: withdrawal.amount },
            },
        });

        await tx.transaction.create({
            data: {
                walletId: withdrawal.walletId,
                amount: withdrawal.amount,
                type: 'CREDIT',
                description: `Refund for failed transfer: ${data.reference}`,
                referenceId: String(withdrawalId),
                referenceType: 'WITHDRAWAL_REFUND',
            },
        });

        await notifyWithdrawal(withdrawal.wallet.userId, {
            type: 'PAYMENT',
            title: 'Payout Failed',
            message: `Your withdrawal of NGN ${Number(withdrawal.amount).toLocaleString()} failed. The funds have been returned to your wallet.`,
            link: '/tenant/wallet',
        });
    });
}

// POST /api/webhooks/paystack - Handle Paystack webhook
export async function POST(request) {
    try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        const signature = request.headers.get('x-paystack-signature');

        if (!(await validateWebhookSignature(rawBody, signature))) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        switch (event) {
            case 'charge.success':
                if (data.metadata?.type === 'FEATURE_LISTING') {
                    await handleFeaturedListing(data);
                } else {
                    await handleRentalChargeSuccess(data);
                }
                break;

            case 'transfer.success':
                await handleTransferSuccess(data);
                break;

            case 'transfer.failed':
                await handleTransferFailed(data);
                break;
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}