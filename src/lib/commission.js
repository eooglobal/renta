/**
 * Commission Calculator for Renta Platform
 * 
 * Commission breakdown from 10% service fee:
 * - Scout: 3% (capped at 3 years per property)
 * - Affiliate: 2%
 * - Platform: remaining percentage
 */

const COMMISSION_RATES = {
    SCOUT: 0.03,       // 3% of total rent
    AFFILIATE: 0.02,   // 2% of total rent
    PLATFORM: 0.05,    // 5% of total rent (default when both scout + affiliate)
    SERVICE_FEE: 0.10, // 10% total service fee
};

const SCOUT_COMMISSION_YEARS = 3; // Cap scout commission at 3 years

/**
 * Calculate service fee for a rental
 */
export function calculateServiceFee(rentAmount) {
    return Number((rentAmount * COMMISSION_RATES.SERVICE_FEE).toFixed(2));
}

/**
 * Calculate total payable by tenant
 */
export function calculateTotalPayable(rentAmount) {
    const serviceFee = calculateServiceFee(rentAmount);
    return Number((rentAmount + serviceFee).toFixed(2));
}

/**
 * Calculate commission distribution for a rental payment
 */
export function calculateCommissions(rentAmount, { hasScout = false, hasAffiliate = false, scoutLeadDate = null } = {}) {
    const serviceFee = calculateServiceFee(rentAmount);
    const commissions = [];

    let scoutAmount = 0;
    let affiliateAmount = 0;

    // Scout commission (3% of rent, capped at 3 years)
    if (hasScout && scoutLeadDate) {
        const leadDate = new Date(scoutLeadDate);
        const now = new Date();
        const yearsSinceLead = (now - leadDate) / (1000 * 60 * 60 * 24 * 365);

        if (yearsSinceLead <= SCOUT_COMMISSION_YEARS) {
            scoutAmount = Number((rentAmount * COMMISSION_RATES.SCOUT).toFixed(2));
            commissions.push({
                type: 'SCOUT',
                amount: scoutAmount,
                percentage: COMMISSION_RATES.SCOUT * 100,
            });
        }
    }

    // Affiliate commission (2% of rent)
    if (hasAffiliate) {
        affiliateAmount = Number((rentAmount * COMMISSION_RATES.AFFILIATE).toFixed(2));
        commissions.push({
            type: 'AFFILIATE',
            amount: affiliateAmount,
            percentage: COMMISSION_RATES.AFFILIATE * 100,
        });
    }

    // Platform gets the remainder of the service fee
    const platformAmount = Number((serviceFee - scoutAmount - affiliateAmount).toFixed(2));
    commissions.push({
        type: 'PLATFORM',
        amount: platformAmount,
        percentage: Number(((platformAmount / rentAmount) * 100).toFixed(2)),
    });

    return {
        rentAmount,
        serviceFee,
        totalPayable: rentAmount + serviceFee,
        landlordPayout: rentAmount,
        commissions,
    };
}

/**
 * Get price breakdown for display
 */
function roundMoney(value) {
    return Number((value || 0).toFixed(2));
}

function roundPercent(value) {
    return Number((value || 0).toFixed(2));
}

function isScoutLeadEligible(scoutLead) {
    if (!scoutLead?.scoutId || !scoutLead?.createdAt) return false;

    const leadDate = new Date(scoutLead.createdAt);
    if (Number.isNaN(leadDate.getTime())) return false;

    const yearsSinceLead = (Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return yearsSinceLead <= SCOUT_COMMISSION_YEARS;
}

function getSubaccountCode(user) {
    return user?.paystackSubaccountCode || null;
}

function createRecipient({ type, userId, amount, totalPayable, subaccountCode, settlementMode }) {
    return {
        type,
        userId: userId ?? null,
        amount: roundMoney(amount),
        percentageOfTotal: roundPercent((amount / totalPayable) * 100),
        subaccountCode: subaccountCode || null,
        settlementMode,
    };
}

/**
 * Calculate the direct split distribution for a rental.
 * Recipients are derived from trusted server-side rental context.
 */
export function calculateRentalDistribution(rentAmount, { landlord, scoutLead = null, affiliateReferral = null } = {}) {
    const rentAmountNum = roundMoney(Number(rentAmount));
    const serviceFee = calculateServiceFee(rentAmountNum);
    const totalPayable = calculateTotalPayable(rentAmountNum);

    const landlordPayout = rentAmountNum;
    const scoutEligible = isScoutLeadEligible(scoutLead);
    const scoutCommission = scoutEligible ? roundMoney(rentAmountNum * COMMISSION_RATES.SCOUT) : 0;
    const affiliateCommission = affiliateReferral?.affiliateId
        ? roundMoney(rentAmountNum * COMMISSION_RATES.AFFILIATE)
        : 0;
    const platformRevenue = roundMoney(serviceFee - scoutCommission - affiliateCommission);

    const recipients = [];
    const landlordSubaccountCode = getSubaccountCode(landlord);
    recipients.push(createRecipient({
        type: 'LANDLORD',
        userId: landlord?.id,
        amount: landlordPayout,
        totalPayable,
        subaccountCode: landlordSubaccountCode,
        settlementMode: landlordSubaccountCode ? 'PAYSTACK_SPLIT' : 'PENDING_SETUP',
    }));

    if (scoutCommission > 0) {
        const scout = scoutLead?.scout || null;
        const scoutSubaccountCode = getSubaccountCode(scout);
        recipients.push(createRecipient({
            type: 'SCOUT',
            userId: scoutLead.scoutId,
            amount: scoutCommission,
            totalPayable,
            subaccountCode: scoutSubaccountCode,
            settlementMode: scoutSubaccountCode ? 'PAYSTACK_SPLIT' : 'PENDING_SETUP',
        }));
    }

    if (affiliateCommission > 0) {
        const affiliate = affiliateReferral?.affiliate || null;
        const affiliateSubaccountCode = getSubaccountCode(affiliate);
        recipients.push(createRecipient({
            type: 'AFFILIATE',
            userId: affiliateReferral.affiliateId,
            amount: affiliateCommission,
            totalPayable,
            subaccountCode: affiliateSubaccountCode,
            settlementMode: affiliateSubaccountCode ? 'PAYSTACK_SPLIT' : 'PENDING_SETUP',
        }));
    }

    recipients.push(createRecipient({
        type: 'PLATFORM',
        userId: null,
        amount: platformRevenue,
        totalPayable,
        subaccountCode: null,
        settlementMode: 'PLATFORM',
    }));

    const pendingSetupAmount = roundMoney(
        recipients
            .filter((recipient) => recipient.settlementMode === 'PENDING_SETUP')
            .reduce((sum, recipient) => sum + recipient.amount, 0)
    );

    return {
        rentAmount: rentAmountNum,
        serviceFee,
        totalPayable,
        landlordPayout,
        scoutCommission,
        affiliateCommission,
        platformRevenue,
        pendingSetupAmount,
        readySplitAmount: roundMoney(totalPayable - pendingSetupAmount),
        recipients,
    };
}
export function getPriceBreakdown(rentAmount) {
    const serviceFee = calculateServiceFee(rentAmount);
    const total = calculateTotalPayable(rentAmount);

    return {
        rent: rentAmount,
        serviceFee,
        serviceFeePercent: COMMISSION_RATES.SERVICE_FEE * 100,
        total,
    };
}

export { COMMISSION_RATES, SCOUT_COMMISSION_YEARS };


