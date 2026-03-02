import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Fetch tenant's maintenance requests
export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const requests = await prisma.maintenanceRequest.findMany({
            where: { tenantId: parseInt(session.user.id) },
            include: {
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
        console.error('Error fetching maintenance requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new maintenance request
export async function POST(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { rentalId, category, title, description } = body;

        if (!rentalId || !category || !title || !description) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Verify the tenant owns this rental
        const rental = await prisma.rental.findFirst({
            where: {
                id: parseInt(rentalId),
                tenantId: parseInt(session.user.id),
                status: 'ACTIVE'
            }
        });

        if (!rental) {
            return NextResponse.json({ error: 'Active rental not found' }, { status: 404 });
        }

        const maintenanceRequest = await prisma.maintenanceRequest.create({
            data: {
                rentalId: rental.id,
                tenantId: parseInt(session.user.id),
                category,
                title,
                description,
            }
        });

        return NextResponse.json({ message: 'Request submitted successfully', request: maintenanceRequest }, { status: 201 });
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
