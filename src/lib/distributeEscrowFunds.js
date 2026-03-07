import { createNotification } from '@/lib/notifications';

/**
 * Distribute escrow funds to all parties when a rental is released.
 * 
 * Distribution:
 * - Landlord: rentAmount (base rent, e.g. ₦350,000)
 * - Scout: 3% of rentAmount (if attached)
 * - Affiliate: 2% of rentAmount (if attached)
 * - Platform: remainder of the service fee (5%–10% of rentAmount)
 * 
 * @param {Object} tx - Prisma transaction client
 * @param {Object} rental - Full rental record with relations
 * @param {Object} escrow - The escrow record being released
 */
export async function distributeEscrowFunds(tx, rental, escrow) {
    const rentAmountNum = Number(rental.rentAmount);
    const serviceFeeNum = Number(rental.serviceFee);

    // Utility: ensure a user has a wallet
    const ensureWallet = async (userId) => {
        let wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            wallet = await tx.wallet.create({
                data: { userId, balance: 0, totalEarned: 0, totalWithdrawn: 0 }
            });
        }
        return wallet;
    };

    let scoutPaid = 0;
    let affiliatePaid = 0;

    // ── 1. Landlord: Gets the rent price (NOT the total) ──
    const landlordWallet = await ensureWallet(rental.property.landlordId);
    await tx.wallet.update({
        where: { id: landlordWallet.id },
        data: {
            balance: { increment: rentAmountNum },
            totalEarned: { increment: rentAmountNum }
        }
    });
    await tx.transaction.create({
        data: {
            walletId: landlordWallet.id,
            amount: rentAmountNum,
            type: 'CREDIT',
            description: `Rental payout for ${rental.property.title}`,
            referenceId: String(escrow.id),
            referenceType: 'ESCROW'
        }
    });
    createNotification(rental.property.landlordId, {
        type: 'PAYMENT',
        title: 'Funds Released!',
        message: `₦${rentAmountNum.toLocaleString()} has been added to your wallet for ${rental.property.title}.`,
        link: '/landlord/payments'
    });

    // ── 2. Scout: 3% of rent (if attached + within 3 years) ──
    if (rental.property.scoutLead && rental.property.scoutLead.scoutId) {
        const leadDate = new Date(rental.property.scoutLead.createdAt);
        const yearsSinceLead = (Date.now() - leadDate) / (1000 * 60 * 60 * 24 * 365);

        if (yearsSinceLead <= 3) {
            const scoutAmount = Number((rentAmountNum * 0.03).toFixed(2));
            scoutPaid = scoutAmount;

            const scoutWallet = await ensureWallet(rental.property.scoutLead.scoutId);

            const commission = await tx.commission.create({
                data: {
                    escrowId: escrow.id,
                    userId: rental.property.scoutLead.scoutId,
                    type: 'SCOUT',
                    amount: scoutAmount,
                    percentage: 3.00,
                    status: 'PAID',
                    paidAt: new Date()
                }
            });

            await tx.wallet.update({
                where: { id: scoutWallet.id },
                data: {
                    balance: { increment: scoutAmount },
                    totalEarned: { increment: scoutAmount }
                }
            });
            await tx.transaction.create({
                data: {
                    walletId: scoutWallet.id,
                    amount: scoutAmount,
                    type: 'CREDIT',
                    description: `Scout commission (3%) for ${rental.property.title}`,
                    referenceId: String(commission.id),
                    referenceType: 'COMMISSION'
                }
            });

            createNotification(rental.property.scoutLead.scoutId, {
                type: 'PAYMENT',
                title: 'Commission Earned!',
                message: `You earned ₦${scoutAmount.toLocaleString()} scout commission for ${rental.property.title}.`,
                link: '/scout/earnings'
            });
        }
    }

    // ── 3. Affiliate: 2% of rent (if attached) ──
    if (rental.affiliateReferral && rental.affiliateReferral.affiliateId) {
        const affiliateAmount = Number((rentAmountNum * 0.02).toFixed(2));
        affiliatePaid = affiliateAmount;

        const affiliateWallet = await ensureWallet(rental.affiliateReferral.affiliateId);

        const commission = await tx.commission.create({
            data: {
                escrowId: escrow.id,
                userId: rental.affiliateReferral.affiliateId,
                type: 'AFFILIATE',
                amount: affiliateAmount,
                percentage: 2.00,
                status: 'PAID',
                paidAt: new Date()
            }
        });

        await tx.wallet.update({
            where: { id: affiliateWallet.id },
            data: {
                balance: { increment: affiliateAmount },
                totalEarned: { increment: affiliateAmount }
            }
        });
        await tx.transaction.create({
            data: {
                walletId: affiliateWallet.id,
                amount: affiliateAmount,
                type: 'CREDIT',
                description: `Affiliate commission (2%) for referral`,
                referenceId: String(commission.id),
                referenceType: 'COMMISSION'
            }
        });

        createNotification(rental.affiliateReferral.affiliateId, {
            type: 'PAYMENT',
            title: 'Affiliate Commission!',
            message: `You earned ₦${affiliateAmount.toLocaleString()} for a successful referral.`,
            link: '/affiliate/earnings'
        });
    }

    // ── 4. Platform: Gets the remainder of the service fee ──
    const platformAmount = Number((serviceFeeNum - scoutPaid - affiliatePaid).toFixed(2));
    if (platformAmount > 0) {
        await tx.commission.create({
            data: {
                escrowId: escrow.id,
                userId: 1, // Admin/platform user ID
                type: 'PLATFORM',
                amount: platformAmount,
                percentage: Number(((platformAmount / rentAmountNum) * 100).toFixed(2)),
                status: 'PAID',
                paidAt: new Date()
            }
        });
    }

    return {
        landlord: rentAmountNum,
        scout: scoutPaid,
        affiliate: affiliatePaid,
        platform: platformAmount,
        total: rentAmountNum + serviceFeeNum
    };
}
