import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { sendPropertyVerifiedEmail } from '@/lib/email';

// GET /api/admin/properties — List all properties for admin review
export async function GET(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const verificationStatus = searchParams.get('verificationStatus');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = {};
        if (status) where.status = status;
        if (verificationStatus) where.verificationStatus = verificationStatus;

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                include: {
                    images: { take: 1, where: { isPrimary: true } },
                    landlord: {
                        select: { id: true, firstName: true, lastName: true, email: true, phone: true, ninStatus: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.property.count({ where }),
        ]);

        return NextResponse.json({
            properties,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Admin properties error:', error);
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
}

// PATCH /api/admin/properties — Verify/reject a property
export async function PATCH(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { propertyId, action, reason } = body;

        if (!propertyId || !action) {
            return NextResponse.json({ error: 'Property ID and action required' }, { status: 400 });
        }

        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { landlord: true },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        let updateData = {};

        switch (action) {
            case 'verify':
                updateData = {
                    status: 'VERIFIED',
                    verificationStatus: 'VERIFIED',
                    verifiedAt: new Date(),
                    verifiedById: parseInt(session.user.id),
                };
                // Notify landlord
                sendPropertyVerifiedEmail({
                    landlord: property.landlord,
                    property,
                }).catch(console.error);
                break;

            case 'reject':
                updateData = {
                    verificationStatus: 'REJECTED',
                };
                break;

            case 'freeze':
                updateData = { status: 'INACTIVE' };
                break;

            case 'activate':
                updateData = { status: 'VERIFIED' };
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updated = await prisma.property.update({
            where: { id: propertyId },
            data: updateData,
        });

        return NextResponse.json({
            message: `Property ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`,
            property: updated,
        });
    } catch (error) {
        console.error('Admin property action error:', error);
        return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }
}
