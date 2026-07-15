/**
 * Paystack Integration Library
 * Handles payment initialization, verification, and webhook processing
 */

import crypto from 'crypto';
import { getSetting } from './settings';

const PAYSTACK_BASE = 'https://api.paystack.co';

/**
 * Initialize a Paystack transaction
 */
export async function initializePayment({ email, amount, reference, metadata = {}, callbackUrl, splitCode, subaccount, transactionCharge, bearer }) {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');
    
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: Math.round(amount * 100), // Paystack uses kobo
            reference,
            callback_url: callbackUrl,
            metadata,
            channels: ['card', 'bank', 'bank_transfer'],
            ...(splitCode ? { split_code: splitCode } : {}),
            ...(subaccount ? { subaccount } : {}),
            ...(transactionCharge !== undefined ? { transaction_charge: Math.round(transactionCharge * 100) } : {}),
            ...(bearer ? { bearer } : {}),
        }),
    });

    const data = await res.json();
    if (!data.status) {
        throw new Error(data.message || 'Payment initialization failed');
    }

    return data.data; // { authorization_url, access_code, reference }
}

/**
 * Verify a Paystack transaction
 */
/**
 * Create a Paystack subaccount for direct settlement.
 */
export async function createSubaccount({ businessName, bankCode, accountNumber, percentageCharge = 0, contact = {} }) {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Paystack secret key is not configured');

    const payload = {
        business_name: businessName,
        bank_code: bankCode,
        account_number: accountNumber,
        percentage_charge: percentageCharge,
        ...(contact.name ? { primary_contact_name: contact.name } : {}),
        ...(contact.email ? { primary_contact_email: contact.email } : {}),
        ...(contact.phone ? { primary_contact_phone: contact.phone } : {}),
    };

    const res = await fetch(`${PAYSTACK_BASE}/subaccount`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to create Paystack subaccount');
    }

    return data.data;
}

/**
 * Update a Paystack subaccount.
 */
export async function updateSubaccount(idOrCode, data = {}) {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Paystack secret key is not configured');

    const res = await fetch(`${PAYSTACK_BASE}/subaccount/${encodeURIComponent(idOrCode)}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const response = await res.json();
    if (!res.ok || !response.status) {
        throw new Error(response.message || 'Failed to update Paystack subaccount');
    }

    return response.data;
}

/**
 * Create a Paystack transaction split for multiple subaccounts.
 */
export async function createSplit({ name, type = 'percentage', currency = 'NGN', subaccounts = [], bearerType = 'account' }) {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Paystack secret key is not configured');

    const res = await fetch(`${PAYSTACK_BASE}/split`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            type,
            currency,
            bearer_type: bearerType,
            subaccounts,
        }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to create Paystack split');
    }

    return data.data;
}
export async function verifyPayment(reference) {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');

    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
            Authorization: `Bearer ${secret}`,
        },
    });

    const data = await res.json();
    if (!data.status) {
        throw new Error(data.message || 'Payment verification failed');
    }

    return data.data;
}

/**
 * Generate a unique payment reference
 */
export function generateReference(prefix = 'RENTA') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validate Paystack webhook signature
 */
export async function validateWebhookSignature(rawBody, signature) {
    if (!signature) return false;
    const secret = await getSetting('PAYSTACK_SECRET_KEY');

    const hash = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');
    return hash === signature;
}

/**
 * Fetch Nigerian bank list from Paystack
 */
export async function getBanks() {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Paystack secret key is not configured');

    const res = await fetch(`${PAYSTACK_BASE}/bank?country=nigeria&use_cursor=false&perPage=100`, {
        headers: { Authorization: `Bearer ${secret}` },
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
        throw new Error(data.message || 'Failed to fetch Paystack bank list');
    }

    return (data.data || []).map(b => ({
        name: b.name,
        code: b.code,
    })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve bank account details from Paystack
 */
export async function resolveAccount(accountNumber, bankCode) {
    const secret = await getSetting('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Paystack secret key is not configured');

    const url = `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` },
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
        throw new Error(data.message || 'Could not resolve account via Paystack');
    }

    return {
        account_name: data.data.account_name,
        account_number: data.data.account_number,
    };
}

