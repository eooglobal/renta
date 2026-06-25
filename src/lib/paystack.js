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
export async function initializePayment({ email, amount, reference, metadata = {}, callbackUrl }) {
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

