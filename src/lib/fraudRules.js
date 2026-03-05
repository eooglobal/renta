import { prisma } from '@/lib/db';

/**
 * Checks if a landlord is creating properties too quickly (e.g., > 5 in 1 hour).
 * If so, suspends their account to prevent spam/fraud.
 * 
 * @param {number} landlordId The ID of the landlord
 * @returns {Promise<boolean>} True if flagged as fraudulent
 */
export async function checkRapidPropertyCreation(landlordId) {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const lId = parseInt(landlordId);
        if (isNaN(lId)) {
            console.error(`[FRAUD CHECK] Invalid landlordId: ${landlordId}`);
            return false;
        }

        const recentPropertiesCount = await prisma.property.count({
            where: {
                landlordId: lId,
                createdAt: {
                    gte: oneHourAgo,
                },
            },
        });

        if (recentPropertiesCount >= 5) {
            console.warn(`[FRAUD ALERT] Landlord ${landlordId} created ${recentPropertiesCount} properties in 1 hour. Suspending account.`);

            await prisma.user.update({
                where: { id: parseInt(landlordId) },
                data: { status: 'SUSPENDED' },
            });

            // Optionally, we could also automatically mark those recent properties as REJECTED here

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error running rapid property creation check:', error);
        return false;
    }
}

/**
 * Checks for suspicious bank account updates.
 * For example, if a user changes their bank details within 24 hours of an active withdrawal request.
 * 
 * @param {number} userId The ID of the user updating their bank details
 * @returns {Promise<boolean>} True if flagged as fraudulent
 */
export async function checkSuspiciousBankUpdate(userId) {
    try {
        // Find if this user has any pending withdrawal requests
        const pendingWithdrawal = await prisma.withdrawalRequest.findFirst({
            where: {
                wallet: { userId: parseInt(userId) },
                status: 'PENDING'
            }
        });

        // If they have a pending withdrawal and they are changing their bank details, flag it.
        // This is a common tactic to hijack payouts.
        if (pendingWithdrawal) {
            console.warn(`[FRAUD ALERT] User ${userId} attempted to change bank details while having a pending withdrawal. Suspending account.`);

            await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: 'SUSPENDED' },
            });

            // Also halt the withdrawal
            await prisma.withdrawalRequest.update({
                where: { id: pendingWithdrawal.id },
                data: {
                    status: 'REJECTED',
                    adminNotes: 'System flagged: Suspicious bank detail change during pending withdrawal.'
                }
            });

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error running suspicious bank update check:', error);
        return false;
    }
}
