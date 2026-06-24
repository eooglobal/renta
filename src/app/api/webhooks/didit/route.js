import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import crypto from 'crypto';

/**
 * Maps a Didit session status to our ninStatus enum
 */
function mapStatus(diditStatus) {
    switch (diditStatus) {
        case 'Approved':    return 'VERIFIED';
        case 'Declined':    return 'FAILED';
        case 'In Review':
        case 'In Progress': return 'PENDING';
        default:            return null; // Abandoned / Expired — don't update
    }
}

// POST /api/webhooks/didit — Receive async verification results from Didit
export async function POST(request) {
    try {
        const rawBody   = await request.text();
        const signature = request.headers.get('x-signature');
        const timestamp = request.headers.get('x-timestamp');

        // ── 1. Reject stale webhooks (> 5 minutes) ──
        if (timestamp) {
            const diff = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
            if (diff > 300) {
                console.warn('[Didit Webhook] Stale timestamp rejected:', diff, 'seconds old');
                return NextResponse.json({ error: 'Stale request' }, { status: 401 });
            }
        }

        // ── 2. Verify HMAC-SHA256 signature ──
        if (signature) {
            const secret = await getSetting('DIDIT_WEBHOOK_SECRET');
            if (secret) {
                const expected = crypto
                    .createHmac('sha256', secret)
                    .update(rawBody)
                    .digest('hex');

                const expectedBuf = Buffer.from(expected, 'hex');
                const receivedBuf = Buffer.from(signature, 'hex');

                const signaturesMatch =
                    expectedBuf.length === receivedBuf.length &&
                    crypto.timingSafeEqual(expectedBuf, receivedBuf);

                if (!signaturesMatch) {
                    console.warn('[Didit Webhook] Invalid signature');
                    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
                }
            }
        }

        const body = JSON.parse(rawBody);
        const { session_id, status, vendor_data } = body;

        const ninStatus = mapStatus(status);

        // Only update if we have a meaningful status change
        if (ninStatus && vendor_data) {
            const userId = parseInt(vendor_data, 10);

            if (!isNaN(userId)) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { ninStatus },
                });
                console.log(`[Didit Webhook] User ${userId} → ninStatus: ${ninStatus} (session: ${session_id})`);
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('[Didit Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
