import { getSetting } from '@/lib/settings';
import * as paystack from '@/lib/paystack';
import {
  createPaymentDestination,
  createTransactionSplit,
  initializeSplitPayment,
} from '@/lib/paymentGateway';

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

jest.mock('@/lib/paystack', () => ({
  createSubaccount: jest.fn(),
  createSplit: jest.fn(),
  initializePayment: jest.fn(),
  generateReference: jest.fn(),
  verifyPayment: jest.fn(),
  getBanks: jest.fn(),
  resolveAccount: jest.fn(),
}));

jest.mock('@/lib/nomba', () => ({
  initializePayment: jest.fn(),
  verifyPayment: jest.fn(),
  getBanks: jest.fn(),
  resolveAccount: jest.fn(),
}));

describe('paymentGateway direct split helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSetting.mockResolvedValue('paystack');
  });

  it('creates payment destinations through Paystack when Paystack is active', async () => {
    paystack.createSubaccount.mockResolvedValue({ subaccount_code: 'ACCT_abc' });

    const result = await createPaymentDestination({ businessName: 'Landlord' });

    expect(paystack.createSubaccount).toHaveBeenCalledWith({ businessName: 'Landlord' });
    expect(result).toEqual({ subaccount_code: 'ACCT_abc' });
  });

  it('creates transaction splits through Paystack when Paystack is active', async () => {
    paystack.createSplit.mockResolvedValue({ split_code: 'SPL_abc' });

    const result = await createTransactionSplit({ name: 'Rental #1' });

    expect(paystack.createSplit).toHaveBeenCalledWith({ name: 'Rental #1' });
    expect(result).toEqual({ split_code: 'SPL_abc' });
  });

  it('initializes split payments through Paystack when Paystack is active', async () => {
    paystack.initializePayment.mockResolvedValue({ authorization_url: 'https://checkout.paystack.com/test' });

    const result = await initializeSplitPayment({ reference: 'RENTA_REF', splitCode: 'SPL_abc' });

    expect(paystack.initializePayment).toHaveBeenCalledWith({ reference: 'RENTA_REF', splitCode: 'SPL_abc' });
    expect(result).toEqual({ authorization_url: 'https://checkout.paystack.com/test' });
  });

  it('rejects direct split helpers when Nomba is active', async () => {
    getSetting.mockResolvedValue('nomba');

    await expect(createPaymentDestination({})).rejects.toThrow('Direct split payments require Paystack');
    await expect(createTransactionSplit({})).rejects.toThrow('Direct split payments require Paystack');
    await expect(initializeSplitPayment({})).rejects.toThrow('Direct split payments require Paystack');
  });
});
