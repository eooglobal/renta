import { GET, POST } from '@/app/api/payment-setup/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { resolveAccount, createPaymentDestination } from '@/lib/paymentGateway';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/paymentGateway', () => ({
  resolveAccount: jest.fn(),
  createPaymentDestination: jest.fn(),
}));

function jsonRequest(body) {
  return {
    json: async () => body,
  };
}

describe('/api/payment-setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current payout setup state for earning roles', async () => {
    auth.mockResolvedValue({ user: { id: '7', role: 'SCOUT' } });
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      role: 'SCOUT',
      ninStatus: 'VERIFIED',
      bankName: 'GTBank',
      bankAccount: '0123456789',
      bankCode: '058',
      bankAccountName: 'SCOUT USER',
      paymentSetupStatus: 'VERIFIED',
      paymentSetupVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      paystackSubaccountCode: 'ACCT_SCOUT',
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      role: 'SCOUT',
      kycStatus: 'VERIFIED',
      paymentSetupStatus: 'VERIFIED',
      bank: {
        bankName: 'GTBank',
        bankAccount: '0123456789',
        bankCode: '058',
        accountName: 'SCOUT USER',
      },
      hasSubaccount: true,
      paystackSubaccountCode: 'ACCT_SCOUT',
    });
  });

  it('rejects tenants because they are not earning roles', async () => {
    auth.mockResolvedValue({ user: { id: '5', role: 'TENANT' } });

    const res = await POST(jsonRequest({}));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Only landlords, scouts, and affiliates');
  });

  it('requires verified identity before payout setup', async () => {
    auth.mockResolvedValue({ user: { id: '8', role: 'AFFILIATE' } });
    prisma.user.findUnique.mockResolvedValue({
      id: 8,
      role: 'AFFILIATE',
      ninStatus: 'PENDING',
      firstName: 'Ada',
      lastName: 'Okafor',
      email: 'ada@example.com',
      phone: '08012345678',
    });

    const res = await POST(jsonRequest({ bankCode: '058', bankName: 'GTBank', bankAccount: '0123456789' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Identity verification required');
  });

  it('rejects resolved bank names that do not match the user profile', async () => {
    auth.mockResolvedValue({ user: { id: '9', role: 'LANDLORD' } });
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      role: 'LANDLORD',
      ninStatus: 'VERIFIED',
      firstName: 'Ada',
      lastName: 'Okafor',
      email: 'ada@example.com',
      phone: '08012345678',
    });
    resolveAccount.mockResolvedValue({ account_name: 'DIFFERENT PERSON', account_number: '0123456789' });

    const res = await POST(jsonRequest({ bankCode: '058', bankName: 'GTBank', bankAccount: '0123456789' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('does not match');
    expect(createPaymentDestination).not.toHaveBeenCalled();
  });

  it('creates a Paystack subaccount and saves verified payout setup', async () => {
    auth.mockResolvedValue({ user: { id: '9', role: 'LANDLORD' } });
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      role: 'LANDLORD',
      ninStatus: 'VERIFIED',
      firstName: 'Ada',
      lastName: 'Okafor',
      email: 'ada@example.com',
      phone: '08012345678',
    });
    resolveAccount.mockResolvedValue({ account_name: 'ADA OKAFOR', account_number: '0123456789' });
    createPaymentDestination.mockResolvedValue({ id: 123, subaccount_code: 'ACCT_LANDLORD' });
    prisma.user.update.mockResolvedValue({ id: 9 });

    const res = await POST(jsonRequest({ bankCode: '058', bankName: 'GTBank', bankAccount: '0123456789' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(createPaymentDestination).toHaveBeenCalledWith({
      businessName: 'Ada Okafor',
      bankCode: '058',
      accountNumber: '0123456789',
      percentageCharge: 0,
      contact: {
        name: 'Ada Okafor',
        email: 'ada@example.com',
        phone: '08012345678',
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: expect.objectContaining({
        bankName: 'GTBank',
        bankAccount: '0123456789',
        bankCode: '058',
        bankAccountName: 'ADA OKAFOR',
        paystackSubaccountCode: 'ACCT_LANDLORD',
        paystackSubaccountId: 123,
        paymentSetupStatus: 'VERIFIED',
      }),
    });
    expect(body).toMatchObject({ message: 'Payout setup completed', paymentSetupStatus: 'VERIFIED' });
  });
});
