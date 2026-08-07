import { getSetting } from './settings';

export async function getLandlordPublicationBlockers(landlord = {}) {
  const blockers = [];

  const requireKyc = await getSetting('REQUIRE_KYC');
  const isKycRequired = requireKyc !== 'false';

  if (isKycRequired && landlord.ninStatus !== 'VERIFIED') {
    blockers.push('identity verification');
  }

  if (
    landlord.paymentSetupStatus !== 'VERIFIED' ||
    !landlord.paystackSubaccountCode
  ) {
    blockers.push('payout setup');
  }

  return blockers;
}

export async function canLandlordPublishProperty(landlord = {}) {
  const blockers = await getLandlordPublicationBlockers(landlord);
  return blockers.length === 0;
}
