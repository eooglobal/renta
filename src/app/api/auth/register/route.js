import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { dispatchWelcomeNotification } from '@/lib/notificationDispatcher';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();

        // --- Rate Limiting ---
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const { checkRateLimit } = await import('@/lib/rate-limiter');
        // Max 3 registrations per IP per 15 minutes
        const rateLimit = await checkRateLimit(ip, 'register', 3, 15 * 60 * 1000);

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: rateLimit.message },
                { status: 429 }
            );
        }

        // Validation using Zod
        const { userRegistrationSchema } = await import('@/lib/validations');
        const validationResult = userRegistrationSchema.safeParse(body);

        if (!validationResult.success) {
            const firstMessage = validationResult.error.issues?.[0]?.message || 'Invalid data format';
            return NextResponse.json(
                { error: firstMessage, details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { email, password, firstName, lastName, phone, role, ref } = validationResult.data;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Check if phone already exists
        if (phone) {
            const existingPhone = await prisma.user.findUnique({
                where: { phone },
            });

            if (existingPhone) {
                return NextResponse.json(
                    { error: 'An account with this phone number already exists' },
                    { status: 409 }
                );
            }
        }

        // Hashes password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate 6-digit OTP code for non-admin accounts
        const isUserRoleAdmin = role === 'ADMIN';
        const otpCode = isUserRoleAdmin ? null : Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = isUserRoleAdmin ? null : new Date(Date.now() + 10 * 60 * 1000);

        // SECURE TRANSACTION: Ensure user creation and referral mapping are atomic or sequentially safe
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                phone: phone || null,
                passwordHash,
                firstName,
                lastName,
                role: role || 'TENANT',
                isVerified: isUserRoleAdmin,
                otpCode,
                otpExpiresAt,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });

        // Handle Affiliate Referral logic
        if (ref && ref.startsWith('AFF')) {
            const affiliateId = parseInt(ref.replace('AFF', ''), 10);
            if (!isNaN(affiliateId)) {
                // Check if affiliate exists
                const affiliate = await prisma.user.findUnique({
                    where: { id: affiliateId }
                });

                if (affiliate && affiliate.role === 'AFFILIATE') {
                    try {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { referredById: affiliate.id }
                        });
                    } catch (err) {
                        console.error('Failed to link affiliate referral:', err);
                    }
                }
            }
        }

        // Send OTP verification code (Welcome email is held until OTP is verified)
        if (isUserRoleAdmin) {
            dispatchWelcomeNotification({ id: user.id, email: user.email, firstName: user.firstName, role: user.role, phone: user.phone }).catch(console.error);
        } else if (otpCode) {
            const { dispatchOtpNotification } = await import('@/lib/notificationDispatcher');
            dispatchOtpNotification({ id: user.id, email: user.email, firstName: user.firstName, phone: user.phone }, otpCode).catch(console.error);
        }

        return NextResponse.json(
            { 
                message: isUserRoleAdmin ? 'Admin account created successfully' : 'Account created. Please verify your 6-digit OTP code.', 
                requiresOtp: !isUserRoleAdmin,
                email: user.email,
                user 
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
