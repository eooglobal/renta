import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/nomba';

// POST /api/webhooks/nomba — Handle Nomba webhook
export async function POST(request) {
    try {
        const rawBody = await request.text();

        // Validate webhook signature
        if (!(await validateWebhookSignature(rawBody, request.headers))) {
            console.warn('Nomba webhook signature validation failed. Payload:', rawBody);
            // TEMPORARY BYPASS: allow the request to return 200 OK so Nomba dashboard accepts the URL.
            // We will uncomment this once the URL is saved.
            // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { event, data } = JSON.parse(rawBody);

        switch (event) {
            case 'payment_success': {
                // Route based on payment type — mutually exclusive paths
                if (data.order?.metadata?.type === 'FEATURE_LISTING') {
                    // ── Featured Listing Payment ──
                    const propertyId = data.order.metadata.propertyId;

                    // Set featured expiry to 7 days from now
                    const featuredUntil = new Date();
                    featuredUntil.setDate(featuredUntil.getDate() + 7);

                    await prisma.property.update({
                        where: { id: propertyId },
                        data: {
                            isFeatured: true,
                            featuredUntil,
                        },
                    });
                    console.log(`Property ${propertyId} featured successfully via Nomba webhook.`);

                } else {
                    // ── Rental Payment ──
                    const payment = await prisma.payment.findFirst({
                        where: { nombaRef: data.order.orderReference },
                        include: { rental: true },
                    });

                    if (payment && payment.status !== 'SUCCESS') {
                        // Atomic: all rental state changes succeed or fail together
                        await prisma.$transaction(async (tx) => {
                            await tx.payment.update({
                                where: { id: payment.id },
                                data: {
                                    status: 'SUCCESS',
                                    paidAt: new Date(data.time),
                                },
                            });

                            await tx.rental.update({
                                where: { id: payment.rentalId },
                                data: { status: 'ACTIVE' },
                            });

                            // Update corresponding property to RENTED
                            await tx.property.update({
                                where: { id: payment.rental.propertyId },
                                data: { status: 'RENTED' },
                            });

                            // Set Escrow status to HELD
                            const escrow = await tx.escrow.findFirst({
                                where: { rentalId: payment.rentalId },
                            });
                            if (escrow) {
                                await tx.escrow.update({
                                    where: { id: escrow.id },
                                    data: { status: 'HELD' },
                                });
                            }
                        });
                    }
                }
                break;
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Nomba webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
