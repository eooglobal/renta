import { POST } from '@/app/api/payments/initialize/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  createTransactionSplit,
  generateReference,
  getActiveGateway,
  initializeSplitPayment,
} from '@/lib/paymentGateway';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
    },
    rental: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    escrow: {
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    affiliateReferral: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/paymentGateway', () => ({
  createTransactionSplit: jest.fn(),
  generateReference: jest.fn(),
  getActiveGateway: jest.fn(),
  initializePayment: jest.fn(),
  initializeSplitPayment: jest.fn(),
}));

function jsonRequest(body) {
  return {
    json: async () => body,
    nextUrl: { origin: 'https://renta.test' },
  };
}

describe('/api/payments/initialize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: '3', role: 'TENANT' } });
    generateReference.mockReturnValue('RENTA_TEST_REF');
    getActiveGateway.mockResolvedValue('paystack');
    prisma.rental.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 3,
      email: 'tenant@example.com',
      referredById: null,
    });
    prisma.affiliateReferral.findFirst.mockResolvedValue(null);
  });

  it('initializes new rentals as Paystack direct split payments without creating escrow', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'prop_1',
      title: 'Ikoyi Flat',
      status: 'VERIFIED',
      rentPrice: 100000,
      landlord: {
        id: 7,
        firstName: 'Ada',
        lastName: 'Okafor',
        paymentSetupStatus: 'VERIFIED',
        paystackSubaccountCode: 'ACCT_LANDLORD',
      },
      scoutLead: {
        id: 11,
        scoutId: 8,
        createdAt: new Date(),
        scout: {
          id: 8,
          paymentSetupStatus: 'VERIFIED',
          paystackSubaccountCode: 'ACCT_SCOUT',
        },
      },
    });
    prisma.rental.create.mockResolvedValue({ id: 44, propertyId: 'prop_1', tenantId: 3 });
    prisma.payment.create.mockResolvedValue({ id: 55 });
    createTransactionSplit.mockResolvedValue({ id: 99, split_code: 'SPL_RENTA' });
    initializeSplitPayment.mockResolvedValue({
      authorization_url: 'https://checkout.paystack.com/direct-split',
      reference: 'RENTA_TEST_REF',
    });

    const res = await POST(jsonRequest({ propertyId: 'prop_1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.escrow.create).not.toHaveBeenCalled();
    expect(prisma.rental.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 3,
        propertyId: 'prop_1',
        paymentMode: 'DIRECT_SPLIT',
        splitCode: 'SPL_RENTA',
        splitId: 99,
        landlordPayoutAmount: 100000,
        scoutCommissionAmount: 3000,
        affiliateCommissionAmount: 0,
        platformRevenueAmount: 7000,
        scoutId: 8,
        affiliateId: null,
        status: 'PENDING',
      }),
    });
    expect(createTransactionSplit).toHaveBeenCalledWith({
      name: 'Renta rental prop_1 RENTA_TEST_REF',
      type: 'percentage',
      currency: 'NGN',
      bearerType: 'account',
      subaccounts: [
        { subaccount: 'ACCT_LANDLORD', share: expect.any(Number) },
        { subaccount: 'ACCT_SCOUT', share: expect.any(Number) },
      ],
    });
    expect(initializeSplitPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        splitCode: 'SPL_RENTA',
        amount: 110000,
        reference: 'RENTA_TEST_REF',
      }),
    );
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentalId: 44,
        amount: 110000,
        paystackRef: 'RENTA_TEST_REF',
        gateway: 'PAYSTACK',
        splitPayload: expect.objectContaining({ splitCode: 'SPL_RENTA' }),
      }),
    });
    expect(body).toMatchObject({
      message: 'Payment initialized',
      paymentUrl: 'https://checkout.paystack.com/direct-split',
      reference: 'RENTA_TEST_REF',
    });
  });
});