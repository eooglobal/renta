import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

const DIDIT_BASE = 'https://verification.didit.me';

/**
 * Maps a Didit session status to our ninStatus enum
 */
function mapStatus(diditStatus) {
    switch (diditStatus) {
        case 'Approved':    return 'VERIFIED';
        case 'Declined':    return 'FAILED';
        case 'In Review':
        case 'In Progress':
        case 'Not Started': return 'PENDING';
        default:            return null; // Abandoned / unknown — don't update
    }
}

// GET /api/verification/didit/callback — Didit redirects user here after verification
export async function GET(request) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=error`);
        }

        // Find user by diditSessionId
        const user = await prisma.user.findFirst({
            where: { diditSessionId: sessionId },
            select: { id: true, ninStatus: true },
        });

        if (!user) {
            console.warn('[Didit] Callback: No user found for session', sessionId);
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=error`);
        }

        // Fetch decision from Didit
        const apiKey = await getSetting('DIDIT_API_KEY');
        const decisionRes = await fetch(`${DIDIT_BASE}/v3/session/${sessionId}/decision/`, {
            headers: { 'x-api-key': apiKey },
        });

        if (!decisionRes.ok) {
            console.error('[Didit] Failed to fetch decision for session', sessionId);
            // Don't fail hard — the webhook will update status async
            return NextResponse.redirect(`${appUrl}/tenant/profile?verification=pending`);
        }

        const decision = await decisionRes.json();
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
        console.error('[Didit] Callback error:', error);
        return NextResponse.redirect(`${appUrl}/tenant/profile?verification=error`);
    }
}
