export function getLandlordPublicationBlockers(landlord = {}) {
  const blockers = [];

  if (landlord.ninStatus !== 'VERIFIED') {
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

export function canLandlordPublishProperty(landlord = {}) {
  return getLandlordPublicationBlockers(landlord).length === 0;
}
