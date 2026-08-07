import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otpCode } = body;

        if (!email || !otpCode) {
            return NextResponse.json(
                { error: 'Email and 6-digit verification code are required' },
                { status: 400 }
            );
        }

        const cleanEmail = String(email).toLowerCase().trim();
        const cleanCode = String(otpCode).trim();

        const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User account not found' },
                { status: 404 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json({
                success: true,
                message: 'Account is already verified.',
                role: user.role,
            });
        }

        if (!user.otpCode || user.otpCode !== cleanCode) {
            return NextResponse.json(
                { error: 'Invalid 6-digit verification code. Please check and try again.' },
                { status: 400 }
            );
        }

        if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
            return NextResponse.json(
                { error: 'Verification code has expired. Please click resend to get a new code.' },
                { status: 400 }
            );
        }

        // Mark account as verified and clear OTP code
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Account verified successfully!',
            role: user.role,
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify OTP code. Please try again.' },
            { status: 500 }
        );
    }
}
