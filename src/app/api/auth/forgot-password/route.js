import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Please enter a valid email address.' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        // Always return success message to prevent user/email enumeration attacks
        if (!user) {
            return NextResponse.json({
                message: 'If an account exists with this email, password reset instructions have been sent.'
            });
        }

        // Generate 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode,
                otpExpiresAt
            }
        });

        // Send email
        await sendPasswordResetEmail(user, otpCode).catch((err) => {
            console.error('[Forgot Password] Email dispatch error:', err);
        });

        return NextResponse.json({
            message: 'If an account exists with this email, password reset instructions have been sent.'
        });
    } catch (error) {
        console.error('[Forgot Password Error]:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
