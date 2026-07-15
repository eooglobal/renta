import { getSetting } from '@/lib/settings';
import { createSubaccount, createSplit, initializePayment } from '@/lib/paystack';

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

describe('paystack service helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSetting.mockResolvedValue('sk_test_secret');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('creates a Paystack subaccount with verified bank destination details', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: true,
        data: {
          id: 123,
          subaccount_code: 'ACCT_abc',
          account_name: 'Renta Landlord',
        },
      }),
    });

    const result = await createSubaccount({
      businessName: 'Renta Landlord',
      bankCode: '058',
      accountNumber: '0123456789',
      percentageCharge: 0,
      contact: {
        name: 'Renta Landlord',
        email: 'landlord@example.com',
        phone: '08012345678',
      },
    });

    expect(global.fetch).toHaveBeenCalledWith('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sk_test_secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: 'Renta Landlord',
        bank_code: '058',
        account_number: '0123456789',
        percentage_charge: 0,
        primary_contact_name: 'Renta Landlord',
        primary_contact_email: 'landlord@example.com',
        primary_contact_phone: '08012345678',
      }),
    });
    expect(result).toEqual({
      id: 123,
      subaccount_code: 'ACCT_abc',
      account_name: 'Renta Landlord',
    });
  });

  it('creates a transaction split for multiple ready recipients', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: true,
        data: {
          id: 456,
          split_code: 'SPL_abc',
        },
      }),
    });

    const result = await createSplit({
      name: 'Renta rental #42',
      type: 'percentage',
      currency: 'NGN',
      bearerType: 'account',
      subaccounts: [
        { subaccount: 'ACCT_landlord', share: 9091 },
        { subaccount: 'ACCT_scout', share: 273 },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith('https://api.paystack.co/split', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sk_test_secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Renta rental #42',
        type: 'percentage',
        currency: 'NGN',
        bearer_type: 'account',
        subaccounts: [
          { subaccount: 'ACCT_landlord', share: 9091 },
          { subaccount: 'ACCT_scout', share: 273 },
        ],
      }),
    });
    expect(result).toEqual({ id: 456, split_code: 'SPL_abc' });
  });

  it('initializes a payment with split_code when supplied', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test',
          access_code: 'access',
          reference: 'RENTA_REF',
        },
      }),
    });

    await initializePayment({
      email: 'tenant@example.com',
      amount: 110000,
      reference: 'RENTA_REF',
      callbackUrl: 'https://userenta.com/verify',
      metadata: { rentalId: 42 },
      splitCode: 'SPL_abc',
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      email: 'tenant@example.com',
      amount: 11000000,
      reference: 'RENTA_REF',
      callback_url: 'https://userenta.com/verify',
      metadata: { rentalId: 42 },
      split_code: 'SPL_abc',
    });
  });
});
