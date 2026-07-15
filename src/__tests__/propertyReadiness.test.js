import {
  canLandlordPublishProperty,
  getLandlordPublicationBlockers,
} from '@/lib/propertyReadiness';

describe('property readiness', () => {
  it('allows verified landlords with a completed Paystack payout destination', () => {
    expect(
      canLandlordPublishProperty({
        ninStatus: 'VERIFIED',
        paymentSetupStatus: 'VERIFIED',
        paystackSubaccountCode: 'ACCT_landlord',
      })
    ).toBe(true);
  });

  it('blocks publication when identity verification is missing', () => {
    expect(
      getLandlordPublicationBlockers({
        ninStatus: 'PENDING',
        paymentSetupStatus: 'VERIFIED',
        paystackSubaccountCode: 'ACCT_landlord',
      })
    ).toEqual(['identity verification']);
  });

  it('blocks publication when payout setup is incomplete', () => {
    expect(
      getLandlordPublicationBlockers({
        ninStatus: 'VERIFIED',
        paymentSetupStatus: 'PENDING',
        paystackSubaccountCode: null,
      })
    ).toEqual(['payout setup']);
  });
});
