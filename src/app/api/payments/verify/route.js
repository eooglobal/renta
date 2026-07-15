import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paymentGateway';
import { sendPaymentConfirmation } from '@/lib/email';
import { applyRentalPaymentSuccess } from '@/lib/rentalPaymentSuccess';
import { dispatchRentalPaidNotifications } from '@/lib/notificationDispatcher';

function successMessageFor(payment) {
    return payment.rental.paymentMode === 'DIRECT_SPLIT'
        ? 'Payment verified successfully. Direct split settlement initiated.'
        : 'Payment verified successfully. Funds held in escrow.';
}

// GET /api/payments/verify?reference=xxx - Verify payment after gateway redirect
export async function GET(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json({ error: 'Reference required' }, { status: 400 });
        }

        const payment = await prisma.payment.findFirst({
            where: { OR: [{ paystackRef: reference }, { nombaRef: reference }] },
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

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.rental.tenantId !== parseInt(session.user.id, 10)) {
            return NextResponse.json({ error: 'Not authorized to verify this payment' }, { status: 403 });
        }

        if (payment.status === 'SUCCESS') {
            return NextResponse.json({ message: 'Payment already verified', payment });
        }

        const paymentData = await verifyPayment(reference);

        if (paymentData.status === 'success') {
            await prisma.$transaction(async (tx) => {
                await applyRentalPaymentSuccess(tx, { payment, paymentData });
            });

            const tenant = payment.rental.tenant;
            const property = payment.rental.property;

            sendPaymentConfirmation({
                tenant,
                property,
                rental: payment.rental,
            }).catch(console.error);

            dispatchRentalPaidNotifications(payment).catch(console.error);

            return NextResponse.json({
                message: successMessageFor(payment),
                status: 'success',
            });
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
        });

        return NextResponse.json({
            message: 'Payment verification failed',
            status: 'failed',
        });
    } catch (error) {
        console.error('Payment verify error:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}