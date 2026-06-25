import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

const DIDIT_BASE = 'https://verification.didit.me';

function mapStatus(diditStatus) {
    switch (diditStatus) {
        case 'Approved':    return 'VERIFIED';
        case 'Declined':    return 'FAILED';
        case 'In Review':
        case 'In Progress':
        case 'Not Started': return 'PENDING';
        default:            return null;
    }
}

// GET /api/verification/didit/callback — Didit redirects user here after verification
export async function GET(request) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');

        console.log('[Didit Callback] Received session_id:', sessionId);

        if (!sessionId) {
            console.warn('[Didit Callback] No session_id in query params');
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=error`);
        }

        // Find user by diditSessionId
        const user = await prisma.user.findFirst({
            where: { diditSessionId: sessionId },
            select: { id: true, ninStatus: true },
        });

        if (!user) {
            console.warn('[Didit Callback] No user found for session:', sessionId);
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=error`);
        }

        // Fetch decision from Didit
        const apiKey = (await getSetting('DIDIT_API_KEY')) || process.env.DIDIT_API_KEY;

        if (!apiKey) {
            console.error('[Didit Callback] API key missing — cannot fetch decision');
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=pending`);
        }

        const decisionRes = await fetch(`${DIDIT_BASE}/v3/session/${sessionId}/decision/`, {
            headers: { 'x-api-key': apiKey },
        });

        const decisionText = await decisionRes.text();
        console.log(`[Didit Callback] Decision response (${decisionRes.status}):`, decisionText);

        if (!decisionRes.ok) {
            // Decision not yet available — session may still be in progress
            console.warn('[Didit Callback] Decision not ready for session:', sessionId, '— redirecting to pending');
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=pending`);
        }

        let decision;
        try {
            decision = JSON.parse(decisionText);
        } catch {
            console.error('[Didit Callback] Failed to parse decision JSON');
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=pending`);
        }

        console.log('[Didit Callback] Decision status:', decision.status);

        const ninStatus = mapStatus(decision.status);

        if (ninStatus) {
            await prisma.user.update({
                where: { id: user.id },
                data: { ninStatus },
            });
        }

        const outcome = ninStatus === 'VERIFIED' ? 'complete'
                      : ninStatus === 'FAILED'   ? 'failed'
                      : 'pending';

        return NextResponse.redirect(`${appUrl}/tenant/profile?verification=${outcome}`);
    } catch (error) {
        console.error('[Didit Callback] Unexpected error:', error);
        return NextResponse.redirect(`${appUrl}/tenant/profile?verification=error`);
    }
}
