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
        if (!validateWebhookSignature(rawBody, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        switch (event) {
            case 'charge.success': {
                const reference = data.reference;

                const payment = await prisma.payment.findFirst({
                    where: { paymentRef: reference },
                });

                if (payment && payment.status !== 'SUCCESS') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'SUCCESS',
                            paidAt: new Date(data.paid_at),
                        },
                    });

                    await prisma.rental.update({
                        where: { id: payment.rentalId },
                        data: { status: 'ACTIVE' },
                    });

                    // Update corresponding property to RENTED
                    await prisma.property.update({
                        where: { id: payment.rental.propertyId },
                        data: { status: 'RENTED' }
                    });

                    // Set Escrow status to HELD
                    const escrow = await prisma.escrow.findFirst({
                        where: { rentalId: payment.rentalId }
                    });
                    if (escrow) {
                        await prisma.escrow.update({
                            where: { id: escrow.id },
                            data: { status: 'HELD', heldAt: new Date() }
                        });
                    }
                }

                // Handle Featured Listing Payments
                if (data.metadata?.type === 'FEATURE_LISTING') {
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
                }
                break;
            }

            case 'transfer.success': {
                // Handle successful transfer to landlord
                console.log('Transfer successful:', data.reference);
                break;
            }

            case 'transfer.failed': {
                // Handle failed transfer
                console.log('Transfer failed:', data.reference);
                break;
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
