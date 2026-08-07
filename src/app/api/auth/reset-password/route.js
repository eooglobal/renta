import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otpCode, newPassword } = body;

        if (!email || !otpCode || !newPassword) {
            return NextResponse.json(
                { error: 'Email, verification code, and new password are required.' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long.' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const cleanCode = String(otpCode).trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user || !user.otpCode || !user.otpExpiresAt) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code. Please request a new code.' },
                { status: 400 }
            );
        }

        if (user.otpCode !== cleanCode) {
            return NextResponse.json(
                { error: 'Invalid verification code. Please check your email and try again.' },
                { status: 400 }
            );
        }

        if (new Date() > new Date(user.otpExpiresAt)) {
            return NextResponse.json(
                { error: 'Verification code has expired. Please request a new code.' },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password and clear OTP fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                otpCode: null,
                otpExpiresAt: null
            }
        });

        return NextResponse.json({
            message: 'Password reset successful! You can now log in with your new password.'
        });
    } catch (error) {
        console.error('[Reset Password Error]:', error);
        return NextResponse.json(
            { error: 'Failed to reset password. Please try again later.' },
            { status: 500 }
        );
    }
}
