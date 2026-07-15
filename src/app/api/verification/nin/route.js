import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Legacy NIN fallback is intentionally disabled. Identity verification must go through Didit.
export async function POST() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
        {
            error: 'NIN fallback verification has been retired. Please complete identity verification with Didit.',
            provider: 'DIDIT',
        },
        { status: 410 }
    );
}