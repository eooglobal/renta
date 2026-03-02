import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nin } = body;

        if (!nin || nin.length !== 11 || !/^\d+$/.test(nin)) {
            return NextResponse.json({ error: 'Invalid NIN. Must be exactly 11 digits.' }, { status: 400 });
        }

        // Simulate network delay to external VerifyMe API
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock verification logic: let's pretend NINs ending in 000 fail, all else succeed
        if (nin.endsWith('000')) {
            await prisma.user.update({
                where: { id: parseInt(session.user.id) },
                data: { ninStatus: 'REJECTED' }
            });
            return NextResponse.json({ error: 'NIN Verification failed. Identity could not be confirmed.' }, { status: 400 });
        }

        // Mask the NIN before saving (e.g., *******1234)
        const maskedNin = '*'.repeat(7) + nin.slice(-4);

        // Update user status
        await prisma.user.update({
            where: { id: parseInt(session.user.id) },
            data: {
                ninStatus: 'VERIFIED',
                ninNumber: maskedNin,
            }
        });

        return NextResponse.json({ message: 'NIN successfully verified' });
    } catch (error) {
        console.error('NIN Verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
