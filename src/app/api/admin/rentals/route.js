import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = {};
        if (status) where.status = status;

        const [rentals, total] = await Promise.all([
            prisma.rental.findMany({
                where,
                include: {
                    property: {
                        select: {
                            id: true,
                            title: true,
                            city: { select: { name: true } },
                            area: { select: { name: true } },
                            landlord: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }
                            }
                        }
                    },
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    escrow: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.rental.count({ where }),
        ]);

        return NextResponse.json({
            rentals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin rentals list error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function buildResolutionNote({ existingReason, adminId, outcome, note }) {
    const adminNote = `[ADMIN ${adminId}] ${outcome}: ${note}`;
    return existingReason ? `${existingReason}\n${adminNote}` : adminNote;
}

export async function PATCH(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { rentalId, action, outcome, note } = body;

        if (!rentalId || !action) {
            return NextResponse.json({ error: 'Rental ID and action required' }, { status: 400 });
        }

        if (action !== 'resolve_direct_split_dispute') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const cleanNote = String(note || '').trim();
        if (cleanNote.length < 5) {
            return NextResponse.json({ error: 'A resolution note is required' }, { status: 400 });
        }

        const allowedOutcomes = new Set(['RESTORE_ACTIVE', 'CANCEL_RENTAL']);
        if (!allowedOutcomes.has(outcome)) {
            return NextResponse.json({ error: 'Invalid direct split dispute outcome' }, { status: 400 });
        }

        const rental = await prisma.rental.findUnique({
            where: { id: parseInt(rentalId, 10) },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        landlordId: true,
                    },
                },
            },
        });

        if (!rental) {
            return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
        }

        if (rental.paymentMode !== 'DIRECT_SPLIT') {
            return NextResponse.json({ error: 'Use legacy escrow resolution for this rental.' }, { status: 400 });
        }

        if (rental.status !== 'DISPUTED') {
            return NextResponse.json({ error: `Rental is not disputed. Current status is ${rental.status}.` }, { status: 400 });
        }

        const nextRentalStatus = outcome === 'RESTORE_ACTIVE' ? 'ACTIVE' : 'CANCELLED';
        const nextPropertyStatus = outcome === 'RESTORE_ACTIVE' ? 'RENTED' : 'VERIFIED';
        const resolutionNote = buildResolutionNote({
            existingReason: rental.disputeReason,
            adminId: session.user.id,
            outcome,
            note: cleanNote,
        });

        const updatedRental = await prisma.rental.update({
            where: { id: rental.id },
            data: {
                status: nextRentalStatus,
                disputeResolvedAt: new Date(),
                disputeResolutionNote: resolutionNote,
            },
        });

        await prisma.property.update({
            where: { id: rental.propertyId },
            data: { status: nextPropertyStatus },
        });

        await createNotification(rental.tenantId, {
            type: 'DISPUTE',
            title: 'Dispute Resolved',
            message: `Renta has reviewed the dispute for ${rental.property.title}. ${cleanNote}`,
            link: '/tenant/rentals',
        });

        await createNotification(rental.property.landlordId, {
            type: 'DISPUTE',
            title: 'Dispute Resolved',
            message: `Renta has reviewed the dispute for ${rental.property.title}. ${cleanNote}`,
            link: '/landlord/tenants',
        });

        return NextResponse.json({
            message: 'Direct split dispute resolved.',
            status: 'resolved',
            rental: updatedRental,
        });
    } catch (error) {
        console.error('Admin rental update error:', error);
        return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 });
    }
}