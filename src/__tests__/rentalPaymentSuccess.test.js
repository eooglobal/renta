import { applyRentalPaymentSuccess } from '@/lib/rentalPaymentSuccess';

function createTx() {
  return {
    payment: { update: jest.fn() },
    rental: { update: jest.fn() },
    property: { update: jest.fn() },
    escrow: { update: jest.fn() },
    commission: { create: jest.fn() },
  };
}

describe('applyRentalPaymentSuccess', () => {
  it('activates direct split rentals and records paid/pending setup commissions without touching escrow', async () => {
    const tx = createTx();
    const paidAt = new Date('2026-07-15T10:00:00.000Z');
    const payment = {
      id: 5,
      rentalId: 44,
      splitPayload: {
        distribution: {
          recipients: [
            { type: 'LANDLORD', userId: 7, amount: 100000, settlementMode: 'PAYSTACK_SPLIT', subaccountCode: 'ACCT_LANDLORD' },
            { type: 'SCOUT', userId: 8, amount: 3000, percentageOfTotal: 2.73, settlementMode: 'PAYSTACK_SPLIT', subaccountCode: 'ACCT_SCOUT' },
            { type: 'AFFILIATE', userId: 9, amount: 2000, percentageOfTotal: 1.82, settlementMode: 'PENDING_SETUP', subaccountCode: null },
            { type: 'PLATFORM', userId: null, amount: 5000, settlementMode: 'PLATFORM' },
          ],
        },
      },
      rental: {
        id: 44,
        paymentMode: 'DIRECT_SPLIT',
        propertyId: 'prop_1',
        escrow: null,
      },
    };

    await applyRentalPaymentSuccess(tx, {
      payment,
      paymentData: {
        paid_at: paidAt.toISOString(),
        gatewayPayload: { reference: 'RENTA_REF' },
      },
    });

    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: expect.objectContaining({
        status: 'SUCCESS',
        paidAt,
        gatewayPayload: { reference: 'RENTA_REF' },
      }),
    });
    expect(tx.rental.update).toHaveBeenCalledWith({
      where: { id: 44 },
      data: { status: 'ACTIVE' },
    });
    expect(tx.property.update).toHaveBeenCalledWith({
      where: { id: 'prop_1' },
      data: { status: 'RENTED' },
    });
    expect(tx.escrow.update).not.toHaveBeenCalled();
    expect(tx.commission.create).toHaveBeenCalledTimes(2);
    expect(tx.commission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentalId: 44,
        userId: 8,
        type: 'SCOUT',
        amount: 3000,
        percentage: 2.73,
        status: 'PAID',
        settlementMode: 'PAYSTACK_SPLIT',
        paystackSubaccountCode: 'ACCT_SCOUT',
        paidAt,
      }),
    });
    expect(tx.commission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentalId: 44,
        userId: 9,
        type: 'AFFILIATE',
        amount: 2000,
        percentage: 1.82,
        status: 'PENDING_SETUP',
        settlementMode: 'PENDING_SETUP',
        paystackSubaccountCode: null,
        paidAt: null,
      }),
    });
  });

  it('preserves legacy escrow handling for escrow-mode rentals', async () => {
    const tx = createTx();
    const payment = {
      id: 6,
      rentalId: 45,
      splitPayload: null,
      rental: {
        id: 45,
        paymentMode: 'ESCROW',
        propertyId: 'prop_2',
        escrow: { id: 77 },
      },
    };

    await applyRentalPaymentSuccess(tx, {
      payment,
      paymentData: { paid_at: '2026-07-15T10:00:00.000Z' },
    });

    expect(tx.escrow.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: { status: 'HELD' },
    });
    expect(tx.commission.create).not.toHaveBeenCalled();
  });
});