import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getPriceBreakdown } from '@/lib/commission';
import { generatePropertySlug } from '@/lib/slugs';

// GET /api/properties/[id] — Get single property details
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const property = await prisma.property.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ]
            },
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
                city: true,
                area: true,
            },
        });

        if (!property) {
            return NextResponse.json(
                { error: 'Property not found' },
                { status: 404 }
            );
        }

        // Add price breakdown and parse amenities
        const priceBreakdown = getPriceBreakdown(Number(property.rentPrice));
        let amenities = [];
        try {
            amenities = JSON.parse(property.amenities || '[]');
        } catch (e) {
            console.warn('Failed to parse amenities:', e);
        }

        return NextResponse.json({
            property: {
                ...property,
                amenities,
                breakdown: priceBreakdown,
            }
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
        const property = await prisma.property.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ]
            },
            include: { city: true, area: true }
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
            title, description, rentPrice, type, address, cityId, areaId,
            latitude, longitude, amenities, studentFriendly, status,
        } = body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (rentPrice !== undefined) updateData.rentPrice = rentPrice;
        if (type !== undefined) updateData.type = type;
        if (address !== undefined) updateData.address = address;
        if (cityId !== undefined || areaId !== undefined) {
            const finalCityId = cityId !== undefined ? parseInt(cityId) : property.cityId;
            const finalAreaId = areaId !== undefined ? parseInt(areaId) : property.areaId;

            if (!isNaN(finalCityId) && !isNaN(finalAreaId)) {
                // Validate area belongs to city
                const area = await prisma.area.findUnique({
                    where: { id: finalAreaId },
                    select: { cityId: true }
                });

                if (!area || area.cityId !== finalCityId) {
                    return NextResponse.json({ error: 'Selected area does not belong to the selected city' }, { status: 400 });
                }

                if (cityId !== undefined) updateData.cityId = finalCityId;
                if (areaId !== undefined) updateData.areaId = finalAreaId;
            }
        }
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (amenities !== undefined) updateData.amenities = JSON.stringify(amenities);
        if (studentFriendly !== undefined) updateData.studentFriendly = studentFriendly;

        // Regenerate slug if identifying details change
        if (title || cityId || areaId) {
            const finalTitle = title || property.title;

            let finalCity = property.city.name;
            if (cityId) {
                const cId = parseInt(cityId);
                if (!isNaN(cId)) {
                    const cityObj = await prisma.city.findUnique({ where: { id: cId } });
                    if (cityObj) finalCity = cityObj.name;
                }
            }

            let finalArea = property.area.name;
            if (areaId) {
                const aId = parseInt(areaId);
                if (!isNaN(aId)) {
                    const areaObj = await prisma.area.findUnique({ where: { id: aId } });
                    if (areaObj) finalArea = areaObj.name;
                }
            }

            updateData.slug = generatePropertySlug(finalTitle, finalCity, finalArea);
        }

        // Only admin can change status
        if (status !== undefined && isAdmin) {
            updateData.status = status;
        }

        const updated = await prisma.property.update({
            where: { id: id },
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
            where: { id: id },
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

        // Fetch all images to delete them physically
        const images = await prisma.propertyImage.findMany({
            where: { propertyId: id }
        });

        const { deleteFileByUrl } = await import('@/lib/fileCleanup');
        
        // Non-blocking cleanup
        Promise.all(images.map(img => deleteFileByUrl(img.url))).catch(err => {
            console.error('Failed to cleanup property images:', err);
        });

        await prisma.property.delete({ where: { id: id } });

        return NextResponse.json({ message: 'Property deleted' });
    } catch (error) {
        console.error('Property delete error:', error);
        return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }
}
