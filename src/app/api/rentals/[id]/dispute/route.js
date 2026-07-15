import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

function normalizeReason(value) {
  return String(value || '').trim();
}

async function notifyAdmins(notification) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) => createNotification(admin.id, notification)),
  );
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized. Only tenants can initiate rental disputes.' }, { status: 403 });
    }

    const rentalId = parseInt(params.id, 10);
    if (!rentalId) {
      return NextResponse.json({ error: 'Rental ID required' }, { status: 400 });
    }

    const body = await request.json();
    const reason = normalizeReason(body.reason);

    if (reason.length < 10) {
      return NextResponse.json({ error: 'A detailed reason (at least 10 characters) is required to open a dispute.' }, { status: 400 });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        escrow: true,
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

    if (rental.tenantId !== parseInt(session.user.id, 10)) {
      return NextResponse.json({ error: 'Unauthorized. This rental belongs to a different tenant.' }, { status: 403 });
    }

    if (rental.paymentMode !== 'DIRECT_SPLIT') {
      return NextResponse.json({ error: 'Use the legacy escrow dispute flow for this rental.' }, { status: 400 });
    }

    if (rental.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Cannot dispute a rental in ${rental.status} state.` }, { status: 400 });
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rental.id },
      data: {
        status: 'DISPUTED',
        disputeReason: reason,
        disputedById: parseInt(session.user.id, 10),
        disputedAt: new Date(),
        disputeResolvedAt: null,
        disputeResolutionNote: null,
      },
    });

    await createNotification(rental.property.landlordId, {
      type: 'DISPUTE',
      title: 'Rental Dispute Opened',
      message: `A tenant opened a dispute for ${rental.property.title}. Renta support will review the direct split payment case.`,
      link: '/landlord/tenants',
    });

    await notifyAdmins({
      type: 'DISPUTE',
      title: 'Direct Split Dispute Opened',
      message: `Rental #${rental.id} for ${rental.property.title} needs manual review.`,
      link: '/admin/rentals?status=DISPUTED',
    });

    return NextResponse.json({
      message: 'Dispute submitted. Renta support will review this direct split payment case.',
      status: 'disputed',
      rental: updatedRental,
    });
  } catch (error) {
    console.error('Rental dispute error:', error);
    return NextResponse.json({ error: 'Failed to submit rental dispute' }, { status: 500 });
  }
}