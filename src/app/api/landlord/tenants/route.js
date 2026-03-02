import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Fetch landlord's tenants (active rentals for their properties)
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'LANDLORD') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rentals = await prisma.rental.findMany({
            where: {
                property: { landlordId: parseInt(session.user.id) }
            },
            include: {
                tenant: { select: { firstName: true, lastName: true, phone: true, email: true } },
                property: { select: { title: true, address: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rentals);
    } catch (error) {
        console.error('Error fetching landlord tenants:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
