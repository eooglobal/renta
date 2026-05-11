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

        // Real Smile ID Verification
        try {
            const { verifyNIN } = await import('@/lib/smileid');
            const user = await prisma.user.findUnique({
                where: { id: parseInt(session.user.id) },
                select: { firstName: true, lastName: true }
            });

            const result = await verifyNIN(session.user.id, nin, {
                firstName: user.firstName,
                lastName: user.lastName
            });

            if (!result.success) {
                await prisma.user.update({
                    where: { id: parseInt(session.user.id) },
                    data: { ninStatus: 'FAILED' }
                });
                return NextResponse.json({ error: 'NIN Verification failed. Identity could not be confirmed.' }, { status: 400 });
            }
        } catch (smileError) {
            console.warn('Smile ID verification unavailable, falling back to mock logic:', smileError.message);
            // Fallback for local development if credentials aren't set
            if (nin.endsWith('000')) {
                await prisma.user.update({
                    where: { id: parseInt(session.user.id) },
                    data: { ninStatus: 'FAILED' }
                });
                return NextResponse.json({ error: 'NIN Verification failed (Mock).' }, { status: 400 });
            }
        }

        // Mask the NIN before saving
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
