import {
  canLandlordPublishProperty,
  getLandlordPublicationBlockers,
} from '@/lib/propertyReadiness';

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn().mockImplementation(async (key) => {
    if (key === 'REQUIRE_KYC') return 'true';
    return null;
  }),
}));

describe('property readiness', () => {
  it('allows verified landlords with a completed Paystack payout destination', async () => {
    expect(
      await canLandlordPublishProperty({
        ninStatus: 'VERIFIED',
        paymentSetupStatus: 'VERIFIED',
        paystackSubaccountCode: 'ACCT_landlord',
      })
    ).toBe(true);
  });

  it('blocks publication when identity verification is missing', async () => {
    expect(
      await getLandlordPublicationBlockers({
        ninStatus: 'PENDING',
        paymentSetupStatus: 'VERIFIED',
        paystackSubaccountCode: 'ACCT_landlord',
      })
    ).toEqual(['identity verification']);
  });

  it('blocks publication when payout setup is incomplete', async () => {
    expect(
      await getLandlordPublicationBlockers({
        ninStatus: 'VERIFIED',
        paymentSetupStatus: 'PENDING',
        paystackSubaccountCode: null,
      })
    ).toEqual(['payout setup']);
  });
});
