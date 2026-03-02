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
