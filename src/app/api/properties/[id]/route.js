import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getPriceBreakdown } from '@/lib/commission';

// GET /api/properties/[id] — Get single property details
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) },
            include: {
                images: { orderBy: { isPrimary: 'desc' } },
                landlord: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        ninStatus: true, avatar: true, createdAt: true,
                    },
                },
                inspectionSlots: {
                    where: {
                        status: 'AVAILABLE',
                        date: { gte: new Date() },
                    },
                    orderBy: { date: 'asc' },
                    take: 10,
                },
            },
        });

        if (!property) {
            return NextResponse.json(
                { error: 'Property not found' },
                { status: 404 }
            );
        }

        // Add price breakdown
        const priceBreakdown = getPriceBreakdown(Number(property.rentPrice));

        return NextResponse.json({
            property,
            priceBreakdown,
        });
    } catch (error) {
        console.error('Property detail error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch property' },
            { status: 500 }
        );
    }
}

// PUT /api/properties/[id] — Update property (landlord owner only)
export async function PUT(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        // Only owner or admin can update
        const isOwner = property.landlordId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            title, description, rentPrice, type, address, area,
            latitude, longitude, amenities, studentFriendly, status,
        } = body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (rentPrice !== undefined) updateData.rentPrice = rentPrice;
        if (type !== undefined) updateData.type = type;
        if (address !== undefined) updateData.address = address;
        if (area !== undefined) updateData.area = area.toUpperCase();
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (amenities !== undefined) updateData.amenities = amenities;
        if (studentFriendly !== undefined) updateData.studentFriendly = studentFriendly;

        // Only admin can change status
        if (status !== undefined && isAdmin) {
            updateData.status = status;
        }

        const updated = await prisma.property.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { images: true },
        });

        return NextResponse.json({ message: 'Property updated', property: updated });
    } catch (error) {
        console.error('Property update error:', error);
        return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }
}

// DELETE /api/properties/[id] — Delete property (landlord owner or admin)
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) },
            include: { rentals: { where: { status: 'ACTIVE' } } },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const isOwner = property.landlordId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        if (property.rentals.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete property with active rentals' },
                { status: 400 }
            );
        }

        await prisma.property.delete({ where: { id: parseInt(id) } });

        return NextResponse.json({ message: 'Property deleted' });
    } catch (error) {
        console.error('Property delete error:', error);
        return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }
}
