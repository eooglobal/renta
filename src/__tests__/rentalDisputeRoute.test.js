import { POST } from '@/app/api/rentals/[id]/dispute/route';
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
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn(),
}));

function jsonRequest(body) {
  return { json: async () => body };
}

describe('/api/rentals/[id]/dispute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: '3', role: 'TENANT' } });
    prisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  it('marks an active direct split rental as disputed and records the tenant reason', async () => {
    prisma.rental.findUnique.mockResolvedValue({
      id: 44,
      tenantId: 3,
      status: 'ACTIVE',
      paymentMode: 'DIRECT_SPLIT',
      propertyId: 'prop_1',
      property: {
        id: 'prop_1',
        title: 'Ikoyi Flat',
        landlordId: 7,
      },
    });
    prisma.rental.update.mockResolvedValue({ id: 44, status: 'DISPUTED' });

    const res = await POST(
      jsonRequest({ reason: 'The apartment access was not delivered as promised.' }),
      { params: { id: '44' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.rental.update).toHaveBeenCalledWith({
      where: { id: 44 },
      data: expect.objectContaining({
        status: 'DISPUTED',
        disputeReason: 'The apartment access was not delivered as promised.',
        disputedById: 3,
        disputedAt: expect.any(Date),
      }),
    });
    expect(createNotification).toHaveBeenCalledWith(7, expect.objectContaining({
      type: 'DISPUTE',
      title: 'Rental Dispute Opened',
    }));
    expect(createNotification).toHaveBeenCalledWith(1, expect.objectContaining({
      type: 'DISPUTE',
      link: '/admin/rentals?status=DISPUTED',
    }));
    expect(body).toMatchObject({
      status: 'disputed',
      message: 'Dispute submitted. Renta support will review this direct split payment case.',
    });
  });

  it('does not handle escrow rentals through the direct split dispute route', async () => {
    prisma.rental.findUnique.mockResolvedValue({
      id: 45,
      tenantId: 3,
      status: 'ACTIVE',
      paymentMode: 'ESCROW',
      escrow: { id: 77 },
      property: { id: 'prop_2', title: 'Legacy Flat', landlordId: 7 },
    });

    const res = await POST(
      jsonRequest({ reason: 'This is a legacy escrow dispute.' }),
      { params: { id: '45' } },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('legacy escrow dispute flow');
    expect(prisma.rental.update).not.toHaveBeenCalled();
  });
});