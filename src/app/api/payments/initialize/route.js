import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { initializePayment, generateReference } from '@/lib/paystack';
import { getPriceBreakdown } from '@/lib/commission';

// POST /api/payments/initialize — Start a rental payment
export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'TENANT') {
            return NextResponse.json({ error: 'Only tenants can make payments' }, { status: 403 });
        }

        const body = await request.json();
        const { propertyId } = body;

        if (!propertyId) {
            return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
        }

        // Fetch property
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { landlord: true },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        if (property.status !== 'VERIFIED') {
            return NextResponse.json({ error: 'Property is not available for rent' }, { status: 400 });
        }

        // Check for existing active rental on this property
        const existingRental = await prisma.rental.findFirst({
            where: { propertyId, status: 'ACTIVE' },
        });

        if (existingRental) {
            return NextResponse.json({ error: 'This property is already rented' }, { status: 400 });
        }

        // Calculate amounts
        const breakdown = getPriceBreakdown(Number(property.rentPrice));
        const totalAmount = breakdown.total;
        const reference = generateReference();

        // Create pending rental
        const rental = await prisma.rental.create({
            data: {
                tenantId: parseInt(session.user.id),
                propertyId: property.id,
                rentAmount: property.rentPrice,
                serviceFee: breakdown.serviceFee,
                totalPaid: totalAmount,
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                status: 'PENDING',
            },
        });

        // Create escrow record
        const escrow = await prisma.escrow.create({
            data: {
                rentalId: rental.id,
                amount: totalAmount,
                status: 'HELD',
            },
        });

        // Create payment record
        await prisma.payment.create({
            data: {
                rentalId: rental.id,
                amount: totalAmount,
                paymentRef: reference,
                method: 'PAYSTACK',
                status: 'PENDING',
            },
        });

        // Initialize Paystack
        const tenant = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) } });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const paystackData = await initializePayment({
            email: tenant.email,
            amount: totalAmount,
            reference,
            callbackUrl: `${appUrl}/tenant/payments/verify?reference=${reference}`,
            metadata: {
                rentalId: rental.id,
                propertyId: property.id,
                tenantId: session.user.id,
                escrowId: escrow.id,
                custom_fields: [
                    { display_name: 'Property', variable_name: 'property', value: property.title },
                    { display_name: 'Landlord', variable_name: 'landlord', value: `${property.landlord.firstName} ${property.landlord.lastName}` },
                ],
            },
        });

        return NextResponse.json({
            message: 'Payment initialized',
            paymentUrl: paystackData.authorization_url,
            reference: paystackData.reference,
            rental,
        });
    } catch (error) {
        console.error('Payment initialize error:', error);
        return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
    }
}
