import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paymentGateway';
import { sendPaymentConfirmation } from '@/lib/email';

// GET /api/payments/verify?reference=xxx — Verify payment after Paystack redirect
export async function GET(request) {
    try {
        // Require authenticated session
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json({ error: 'Reference required' }, { status: 400 });
        }

        // Find payment
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

        // Verify the caller is the tenant who owns this payment
        if (payment.rental.tenantId !== parseInt(session.user.id)) {
            return NextResponse.json({ error: 'Not authorized to verify this payment' }, { status: 403 });
        }

        if (payment.status === 'SUCCESS') {
            return NextResponse.json({ message: 'Payment already verified', payment });
        }

        // Verify with payment gateway
        const paymentData = await verifyPayment(reference);

        if (paymentData.status === 'success') {
            // ATOMIC TRANSACTION: All state changes succeed or fail together
            await prisma.$transaction(async (tx) => {
                // Update payment
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'SUCCESS',
                        paidAt: new Date(paymentData.paid_at),
                    },
                });

                // Update rental status
                await tx.rental.update({
                    where: { id: payment.rentalId },
                    data: { status: 'ACTIVE' },
                });

                // Update property status
                await tx.property.update({
                    where: { id: payment.rental.propertyId },
                    data: { status: 'RENTED' },
                });

                // Mark escrow as held
                if (payment.rental.escrow) {
                    await tx.escrow.update({
                        where: { id: payment.rental.escrow.id },
                        data: { status: 'HELD' },
                    });
                }
            });

            // Send notification emails (outside transaction — non-critical)
            const tenant = payment.rental.tenant;
            const property = payment.rental.property;

            sendPaymentConfirmation({
                tenant,
                property,
                rental: payment.rental,
            }).catch(console.error);

            return NextResponse.json({
                message: 'Payment verified successfully. Funds held in escrow.',
                status: 'success',
            });
        } else {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'FAILED' },
            });

            return NextResponse.json({
                message: 'Payment verification failed',
                status: 'failed',
            });
        }
    } catch (error) {
        console.error('Payment verify error:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
