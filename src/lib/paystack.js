/**
 * Paystack Integration Library
 * Handles payment initialization, verification, and webhook processing
 */

import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

/**
 * Initialize a Paystack transaction
 */
export async function initializePayment({ email, amount, reference, metadata = {}, callbackUrl }) {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
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
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
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
 * Note: body MUST be the raw request text (string), not a JSON object
 */
export function validateWebhookSignature(rawBody, signature) {
    if (!signature) return false;

    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET)
        .update(rawBody)
        .digest('hex');
    return hash === signature;
}
