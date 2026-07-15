import { calculateRentalDistribution } from '@/lib/commission';

describe('calculateRentalDistribution', () => {
  const recentLeadDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  it('calculates direct split recipients from trusted rental context', () => {
    const distribution = calculateRentalDistribution(100000, {
      landlord: { id: 10, paystackSubaccountCode: 'ACCT_LANDLORD' },
      scoutLead: {
        scoutId: 20,
        createdAt: recentLeadDate,
        scout: { id: 20, paystackSubaccountCode: 'ACCT_SCOUT' },
      },
      affiliateReferral: {
        affiliateId: 30,
        affiliate: { id: 30, paystackSubaccountCode: 'ACCT_AFFILIATE' },
      },
    });

    expect(distribution).toMatchObject({
      rentAmount: 100000,
      serviceFee: 10000,
      totalPayable: 110000,
      landlordPayout: 100000,
      scoutCommission: 3000,
      affiliateCommission: 2000,
      platformRevenue: 5000,
    });

    expect(distribution.recipients).toEqual([
      {
        type: 'LANDLORD',
        userId: 10,
        amount: 100000,
        percentageOfTotal: 90.91,
        subaccountCode: 'ACCT_LANDLORD',
        settlementMode: 'PAYSTACK_SPLIT',
      },
      {
        type: 'SCOUT',
        userId: 20,
        amount: 3000,
        percentageOfTotal: 2.73,
        subaccountCode: 'ACCT_SCOUT',
        settlementMode: 'PAYSTACK_SPLIT',
      },
      {
        type: 'AFFILIATE',
        userId: 30,
        amount: 2000,
        percentageOfTotal: 1.82,
        subaccountCode: 'ACCT_AFFILIATE',
        settlementMode: 'PAYSTACK_SPLIT',
      },
      {
        type: 'PLATFORM',
        userId: null,
        amount: 5000,
        percentageOfTotal: 4.55,
        subaccountCode: null,
        settlementMode: 'PLATFORM',
      },
    ]);
  });

  it('marks scout and affiliate commissions as pending setup when subaccounts are missing', () => {
    const distribution = calculateRentalDistribution(200000, {
      landlord: { id: 10, paystackSubaccountCode: 'ACCT_LANDLORD' },
      scoutLead: {
        scoutId: 20,
        createdAt: recentLeadDate,
        scout: { id: 20, paystackSubaccountCode: null },
      },
      affiliateReferral: {
        affiliateId: 30,
        affiliate: { id: 30, paystackSubaccountCode: null },
      },
    });

    expect(distribution.scoutCommission).toBe(6000);
    expect(distribution.affiliateCommission).toBe(4000);
    expect(distribution.platformRevenue).toBe(10000);
    expect(distribution.pendingSetupAmount).toBe(10000);
    expect(distribution.readySplitAmount).toBe(210000);

    expect(distribution.recipients).toEqual([
      expect.objectContaining({ type: 'LANDLORD', amount: 200000, settlementMode: 'PAYSTACK_SPLIT' }),
      expect.objectContaining({ type: 'SCOUT', amount: 6000, settlementMode: 'PENDING_SETUP' }),
      expect.objectContaining({ type: 'AFFILIATE', amount: 4000, settlementMode: 'PENDING_SETUP' }),
      expect.objectContaining({ type: 'PLATFORM', amount: 10000, settlementMode: 'PLATFORM' }),
    ]);
  });

  it('does not pay scout commission after the commission window expires', () => {
    const oldLeadDate = new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000);

    const distribution = calculateRentalDistribution(100000, {
      landlord: { id: 10, paystackSubaccountCode: 'ACCT_LANDLORD' },
      scoutLead: {
        scoutId: 20,
        createdAt: oldLeadDate,
        scout: { id: 20, paystackSubaccountCode: 'ACCT_SCOUT' },
      },
    });

    expect(distribution.scoutCommission).toBe(0);
    expect(distribution.platformRevenue).toBe(10000);
    expect(distribution.recipients.some((recipient) => recipient.type === 'SCOUT')).toBe(false);
  });
});
