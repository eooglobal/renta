import { GET } from '@/app/api/payments/verify/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyPayment } from '@/lib/paymentGateway';
import { applyRentalPaymentSuccess } from '@/lib/rentalPaymentSuccess';
import { dispatchRentalPaidNotifications } from '@/lib/notificationDispatcher';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    rental: { update: jest.fn() },
    property: { update: jest.fn() },
    escrow: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/paymentGateway', () => ({
  verifyPayment: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendPaymentConfirmation: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/rentalPaymentSuccess', () => ({
  applyRentalPaymentSuccess: jest.fn(),
}));

jest.mock('@/lib/notificationDispatcher', () => ({
  dispatchRentalPaidNotifications: jest.fn(),
}));

describe('/api/payments/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: '3', role: 'TENANT' } });
    prisma.$transaction.mockImplementation(async (callback) => callback({ tx: true }));
    dispatchRentalPaidNotifications.mockResolvedValue([]);
  });

  it('uses direct split success handling for direct split rentals', async () => {
    const payment = {
      id: 5,
      rentalId: 44,
      status: 'PENDING',
      rental: {
        id: 44,
        tenantId: 3,
        propertyId: 'prop_1',
        paymentMode: 'DIRECT_SPLIT',
        tenant: { id: 3, email: 'tenant@example.com' },
        property: { id: 'prop_1', title: 'Ikoyi Flat', landlord: { id: 7 } },
        escrow: null,
      },
    };
    prisma.payment.findFirst.mockResolvedValue(payment);
    verifyPayment.mockResolvedValue({
      status: 'success',
      paid_at: '2026-07-15T10:00:00.000Z',
      reference: 'RENTA_REF',
    });

    const res = await GET(new Request('https://renta.test/api/payments/verify?reference=RENTA_REF'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(applyRentalPaymentSuccess).toHaveBeenCalledWith(
      { tx: true },
      {
        payment,
        paymentData: expect.objectContaining({ status: 'success', reference: 'RENTA_REF' }),
      },
    );
    expect(dispatchRentalPaidNotifications).toHaveBeenCalledWith(payment);
    expect(body).toMatchObject({
      message: 'Payment verified successfully. Direct split settlement initiated.',
      status: 'success',
    });
  });
});