import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// PATCH: Update maintenance request status (Landlord only)
export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'LANDLORD') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ['IN_PROGRESS', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Verify the landlord owns the associated property
        const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
            where: { id: parseInt(id) },
            include: {
                rental: {
                    include: {
                        property: { select: { landlordId: true } }
                    }
                }
            }
        });

        if (!maintenanceRequest || maintenanceRequest.rental.property.landlordId !== parseInt(session.user.id)) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const updated = await prisma.maintenanceRequest.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        return NextResponse.json({ message: `Status updated to ${status}`, request: updated });
    } catch (error) {
        console.error('Error updating maintenance request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
