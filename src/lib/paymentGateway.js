/**
 * Payment Gateway Router
 * Abstracts over Paystack and Nomba behind a unified interface.
 * The active gateway is determined at runtime by reading ACTIVE_PAYMENT_GATEWAY
 * from platform settings, defaulting to "paystack".
 */

import { getSetting } from './settings';
import * as paystack from './paystack';
import * as nomba from './nomba';

/**
 * Returns the currently configured payment gateway.
 * Reads the setting on every call so live changes are honored immediately.
 * Defaults to "paystack" for any value other than the exact string "nomba".
 *
 * @returns {Promise<"paystack"|"nomba">}
 */
export async function getActiveGateway() {
    const value = await getSetting('ACTIVE_PAYMENT_GATEWAY');
    if (!value) {
        console.debug('[paymentGateway] ACTIVE_PAYMENT_GATEWAY not set, defaulting to paystack');
    }
    return value === 'nomba' ? 'nomba' : 'paystack';
}

/**
 * Generate a unique payment reference.
 * Re-uses the same logic as paystack.js.
 *
 * @param {string} [prefix='RENTA']
 * @returns {string}
 */
export function generateReference(prefix = 'RENTA') {
    return paystack.generateReference(prefix);
}

/**
 * Initialize a payment through the active gateway.
 * Always resolves to { authorization_url, reference } regardless of gateway.
 *
 * @param {{ email, amount, reference, callbackUrl, metadata }} params
 * @returns {Promise<{ authorization_url: string, reference: string }>}
 */
export async function initializePayment(params) {
    const gateway = await getActiveGateway();

    if (gateway === 'nomba') {
        const { checkoutLink, orderReference } = await nomba.initializePayment(params);
        return {
            authorization_url: checkoutLink,
            reference: orderReference,
        };
    }

    // Default: paystack â€” returns { authorization_url, access_code, reference } as-is
    return paystack.initializePayment(params);
}

/**
 * Verify a payment through the active gateway.
 * Always resolves to { status, paid_at } regardless of gateway.
 *
 * @param {string} reference
 * @returns {Promise<{ status: "success"|"failed", paid_at: string|null }>}
 */
export async function verifyPayment(reference) {
    const gateway = await getActiveGateway();

    if (gateway === 'nomba') {
        const { status, paidAt, ...rest } = await nomba.verifyPayment(reference);
        return { status, paid_at: paidAt ?? null, ...rest };
    }

    // Default: paystack â€” returns its full data object as-is
    return paystack.verifyPayment(reference);
}

/**
 * Fetch bank list from active gateway
 */

async function requirePaystackForDirectSplit() {
    const gateway = await getActiveGateway();
    if (gateway !== 'paystack') {
        throw new Error('Direct split payments require Paystack as the active gateway');
    }
}

/**
 * Create a direct settlement destination through Paystack.
 */
export async function createPaymentDestination(params) {
    await requirePaystackForDirectSplit();
    return paystack.createSubaccount(params);
}

/**
 * Create a Paystack transaction split for direct rental settlement.
 */
export async function createTransactionSplit(params) {
    await requirePaystackForDirectSplit();
    return paystack.createSplit(params);
}

/**
 * Initialize a payment that uses a Paystack split/subaccount configuration.
 */
export async function initializeSplitPayment(params) {
    await requirePaystackForDirectSplit();
    return paystack.initializePayment(params);
}export async function getBanks() {
    const gateway = await getActiveGateway();
    if (gateway === 'nomba') {
        return nomba.getBanks();
    }
    return paystack.getBanks();
}

/**
 * Resolve bank account details from active gateway
 */
export async function resolveAccount(accountNumber, bankCode) {
    const gateway = await getActiveGateway();
    if (gateway === 'nomba') {
        return nomba.resolveAccount(accountNumber, bankCode);
    }
    return paystack.resolveAccount(accountNumber, bankCode);
}

