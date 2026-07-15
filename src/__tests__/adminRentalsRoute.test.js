import { PATCH } from '@/app/api/admin/rentals/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    rental: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    property: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn(),
}));

function jsonRequest(body) {
  return { json: async () => body };
}

describe('/api/admin/rentals PATCH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: '1', role: 'ADMIN' } });
  });

  it('resolves a direct split dispute and restores the rental as active', async () => {
    prisma.rental.findUnique.mockResolvedValue({
      id: 44,
      tenantId: 3,
      status: 'DISPUTED',
      paymentMode: 'DIRECT_SPLIT',
      disputeReason: 'Tenant reported no access.',
      propertyId: 'prop_1',
      property: {
        id: 'prop_1',
        title: 'Ikoyi Flat',
        landlordId: 7,
      },
    });
    prisma.rental.update.mockResolvedValue({ id: 44, status: 'ACTIVE' });

    const res = await PATCH(jsonRequest({
      rentalId: 44,
      action: 'resolve_direct_split_dispute',
      outcome: 'RESTORE_ACTIVE',
      note: 'Staff confirmed tenant now has access.',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.rental.update).toHaveBeenCalledWith({
      where: { id: 44 },
      data: expect.objectContaining({
        status: 'ACTIVE',
        disputeResolvedAt: expect.any(Date),
        disputeResolutionNote: expect.stringContaining('Staff confirmed tenant now has access.'),
      }),
    });
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: 'prop_1' },
      data: { status: 'RENTED' },
    });
    expect(createNotification).toHaveBeenCalledWith(3, expect.objectContaining({
      title: 'Dispute Resolved',
    }));
    expect(createNotification).toHaveBeenCalledWith(7, expect.objectContaining({
      title: 'Dispute Resolved',
    }));
    expect(body).toMatchObject({ status: 'resolved', rental: { id: 44, status: 'ACTIVE' } });
  });

  it('rejects admin resolution for non-direct-split rentals', async () => {
    prisma.rental.findUnique.mockResolvedValue({
      id: 45,
      tenantId: 3,
      status: 'DISPUTED',
      paymentMode: 'ESCROW',
      property: { id: 'prop_2', title: 'Legacy Flat', landlordId: 7 },
    });

    const res = await PATCH(jsonRequest({
      rentalId: 45,
      action: 'resolve_direct_split_dispute',
      outcome: 'RESTORE_ACTIVE',
      note: 'Wrong route.',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('legacy escrow resolution');
    expect(prisma.rental.update).not.toHaveBeenCalled();
  });
});