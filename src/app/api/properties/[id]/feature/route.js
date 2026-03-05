import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { initializePayment, generateReference } from '@/lib/paystack';

// POST /api/properties/[id]/feature
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'LANDLORD') {
            return NextResponse.json({ error: 'Unauthorized: Only landlords can promote listings.' }, { status: 403 });
        }

        const { id } = await params;
        const property = await prisma.property.findUnique({
            where: { id: id },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const lId = parseInt(session.user.id);
        if (isNaN(lId) || property.landlordId !== lId) {
            return NextResponse.json({ error: 'You do not own this property' }, { status: 403 });
        }

        if (property.status !== 'VERIFIED') {
            return NextResponse.json({ error: 'Only verified properties can be featured.' }, { status: 400 });
        }

        // Set promotion price to Flat ₦5,000
        const featurePrice = 5000;
        const reference = generateReference('FEAT');

        // Initialize Paystack payment for the feature fee
        const paymentInit = await initializePayment({
            email: session.user.email,
            amount: featurePrice,
            reference: reference,
            metadata: {
                propertyId: property.id,
                landlordId: parseInt(session.user.id),
                type: 'FEATURE_LISTING'
            },
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/landlord/properties` // Redirect back to their properties page
        });

        if (!paymentInit.authorization_url) {
            console.error('Paystack initialization failed:', paymentInit);
            return NextResponse.json({ error: 'Failed to initialize payment gateway' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Payment initialized',
            authorization_url: paymentInit.authorization_url,
            reference: paymentInit.reference || reference
        });

    } catch (error) {
        console.error('Feature Property error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
