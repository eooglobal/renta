import { PATCH } from '@/app/api/admin/properties/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendPropertyVerifiedEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendPropertyVerifiedEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn(),
}));

jest.mock('@/lib/images/normalize', () => ({
  normalizePropertyImages: jest.fn((property) => property),
}));

function jsonRequest(body) {
  return {
    json: async () => body,
  };
}

describe('/api/admin/properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({
      user: { id: '1', role: 'ADMIN', adminRole: 'SUPER_ADMIN' },
    });
  });

  it('blocks property verification when landlord payout setup is incomplete', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 10,
      title: 'Ikoyi Flat',
      landlordId: 7,
      landlord: {
        ninStatus: 'VERIFIED',
        paymentSetupStatus: 'PENDING',
        paystackSubaccountCode: null,
      },
    });

    const res = await PATCH(jsonRequest({ propertyId: 10, action: 'verify' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain('payout setup');
    expect(prisma.property.update).not.toHaveBeenCalled();
    expect(sendPropertyVerifiedEmail).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('verifies a property when landlord identity and payout setup are complete', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 10,
      title: 'Ikoyi Flat',
      landlordId: 7,
      landlord: {
        id: 7,
        firstName: 'Ada',
        lastName: 'Okafor',
        email: 'ada@example.com',
        ninStatus: 'VERIFIED',
        paymentSetupStatus: 'VERIFIED',
        paystackSubaccountCode: 'ACCT_landlord',
      },
    });
    prisma.property.update.mockResolvedValue({ id: 10, status: 'VERIFIED' });

    const res = await PATCH(jsonRequest({ propertyId: 10, action: 'verify' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        status: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        verifiedById: 1,
      }),
    });
    expect(body.property).toMatchObject({ id: 10, status: 'VERIFIED' });
  });
});
