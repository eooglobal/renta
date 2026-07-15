import { POST } from '@/app/api/webhooks/paystack/route';
import { prisma } from '@/lib/db';
import { validateWebhookSignature } from '@/lib/paystack';
import { applyRentalPaymentSuccess } from '@/lib/rentalPaymentSuccess';

jest.mock('@/lib/db', () => ({
  prisma: {
    payment: {
      findFirst: jest.fn(),
    },
    property: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/paystack', () => ({
  validateWebhookSignature: jest.fn(),
}));

jest.mock('@/lib/rentalPaymentSuccess', () => ({
  applyRentalPaymentSuccess: jest.fn(),
}));

function webhookRequest(payload) {
  return new Request('https://renta.test/api/webhooks/paystack', {
    method: 'POST',
    headers: { 'x-paystack-signature': 'valid_signature' },
    body: JSON.stringify(payload),
  });
}

describe('/api/webhooks/paystack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateWebhookSignature.mockResolvedValue(true);
    prisma.$transaction.mockImplementation(async (callback) => callback({ tx: true }));
  });

  it('uses shared success handling for rental charge success events', async () => {
    const payment = {
      id: 5,
      rentalId: 44,
      status: 'PENDING',
      rental: {
        id: 44,
        propertyId: 'prop_1',
        paymentMode: 'DIRECT_SPLIT',
        escrow: null,
      },
    };
    prisma.payment.findFirst.mockResolvedValue(payment);

    const payload = {
      event: 'charge.success',
      data: {
        reference: 'RENTA_REF',
        paid_at: '2026-07-15T10:00:00.000Z',
        metadata: { paymentMode: 'DIRECT_SPLIT' },
      },
    };

    const res = await POST(webhookRequest(payload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(applyRentalPaymentSuccess).toHaveBeenCalledWith(
      { tx: true },
      { payment, paymentData: payload.data },
    );
    expect(body).toEqual({ status: 'ok' });
  });
});