import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { isVerified: true, role: true, otpExpiresAt: true }
        });

        if (!user) {
            return NextResponse.json({ exists: false, isVerified: false, isFreshOtp: false });
        }

        // Check if an OTP code was generated in the last 2 minutes (indicates successful password comparison for unverified user)
        const isFreshOtp = Boolean(
            user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() > Date.now() + 8 * 60 * 1000
        );

        return NextResponse.json({
            exists: true,
            isVerified: Boolean(user.isVerified),
            isFreshOtp,
            role: user.role
        });
    } catch (error) {
        console.error('[User Status Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
