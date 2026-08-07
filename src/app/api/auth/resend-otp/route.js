import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { dispatchOtpNotification } from '@/lib/notificationDispatcher';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email address is required' },
                { status: 400 }
            );
        }

        const cleanEmail = String(email).toLowerCase().trim();

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
            });
        }

        // Generate new 6-digit OTP
        const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: newOtpCode,
                otpExpiresAt,
            },
        });

        // Dispatch new OTP via Email and SMS
        await dispatchOtpNotification({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            phone: user.phone,
        }, newOtpCode);

        return NextResponse.json({
            success: true,
            message: 'A new 6-digit verification code has been sent to your email and phone.',
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to resend verification code. Please try again.' },
            { status: 500 }
        );
    }
}
