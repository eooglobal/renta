import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

const DIDIT_BASE = 'https://verification.didit.me';

// POST /api/verification/didit/session — Create a Didit verification session
export async function POST(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey      = await getSetting('DIDIT_API_KEY');
        const workflowId  = await getSetting('DIDIT_WORKFLOW_ID');
        const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';

        if (!apiKey || !workflowId) {
            console.error('[Didit] Missing DIDIT_API_KEY or DIDIT_WORKFLOW_ID');
            return NextResponse.json({ error: 'Verification service not configured' }, { status: 503 });
        }

        const userId = String(session.user.id);

        const res = await fetch(`${DIDIT_BASE}/v3/session/`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                workflow_id: workflowId,
                callback: `${appUrl}/api/verification/didit/callback`,
                vendor_data: userId,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[Didit] Session creation failed:', err);
            return NextResponse.json({ error: 'Failed to create verification session' }, { status: 500 });
        }

        const data = await res.json();
        const { session_id, verification_url } = data;

        // Save the session ID to the user record so we can look them up on callback/webhook
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { diditSessionId: session_id },
        });

        return NextResponse.json({ verification_url, session_id });
    } catch (error) {
        console.error('[Didit] Session error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
