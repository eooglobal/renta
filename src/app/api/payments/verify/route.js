import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { sendPaymentConfirmation } from '@/lib/email';

// GET /api/payments/verify?reference=xxx — Verify payment after Paystack redirect
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json({ error: 'Reference required' }, { status: 400 });
        }

        // Find payment
        const payment = await prisma.payment.findFirst({
            where: { paymentRef: reference },
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

        if (payment.status === 'SUCCESS') {
            return NextResponse.json({ message: 'Payment already verified', payment });
        }

        // Verify with Paystack
        const paystackData = await verifyPayment(reference);

        if (paystackData.status === 'success') {
            // Update payment
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'SUCCESS',
                    paidAt: new Date(paystackData.paid_at),
                },
            });

            // Update rental status
            await prisma.rental.update({
                where: { id: payment.rentalId },
                data: { status: 'ACTIVE' },
            });

            // Update property status
            await prisma.property.update({
                where: { id: payment.rental.propertyId },
                data: { status: 'RENTED' },
            });

            // Mark escrow as held
            if (payment.rental.escrow) {
                await prisma.escrow.update({
                    where: { id: payment.rental.escrow.id },
                    data: { status: 'HELD', heldAt: new Date() },
                });
            }

            // Send notification emails
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
