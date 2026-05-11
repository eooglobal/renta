import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const rentalId = parseInt(id);
        const { signature, role } = await request.json();

        if (!signature) {
            return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
        }

        const rental = await prisma.rental.findUnique({
            where: { id: rentalId },
            include: { 
                agreement: true,
                property: { select: { landlordId: true } }
            }
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        // Check permissions
        const userId = parseInt(session.user.id);
        if (role === 'TENANT' && rental.tenantId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (role === 'LANDLORD' && rental.property.landlordId !== userId) {
            return NextResponse.json({ error: 'Forbidden: You do not own this property' }, { status: 403 });
        }

        const updateData = role === 'TENANT' 
            ? { tenantSignature: signature, tenantSigned: true, tenantSignedAt: new Date() }
            : { landlordSignature: signature, landlordSigned: true, landlordSignedAt: new Date() };

        const agreement = await prisma.rentalAgreement.upsert({
            where: { rentalId: rentalId },
            update: updateData,
            create: {
                rentalId: rentalId,
                ...updateData
            }
        });

        return NextResponse.json({ message: 'Agreement signed successfully', agreement });
    } catch (error) {
        console.error('Error signing agreement:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
