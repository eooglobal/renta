import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Fetch all maintenance requests for the landlord's properties
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'LANDLORD') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where: {
                rental: {
                    property: {
                        landlordId: parseInt(session.user.id)
                    }
                }
            },
            include: {
                tenant: { select: { firstName: true, lastName: true, phone: true } },
                rental: {
                    include: {
                        property: { select: { title: true, address: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching landlord maintenance requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
