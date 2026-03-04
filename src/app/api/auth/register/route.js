import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
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
            return NextResponse.json(
                { error: 'Invalid data format', details: validationResult.error.format() },
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

        // SECURE TRANSACTION: Ensure user creation and referral mapping are atomic or sequentially safe
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                phone: phone || null,
                passwordHash,
                firstName,
                lastName,
                role: role || 'TENANT',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
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

                // Only Affiliates (or potentially Scouts acting as Affiliates) can refer
                // Let's ensure the referring user exists before mapping
                if (affiliate && affiliate.role === 'AFFILIATE') {
                    try {
                        await prisma.affiliateReferral.create({
                            data: {
                                affiliateId: affiliate.id,
                                referredUserId: user.id
                            }
                        });
                    } catch (err) {
                        console.error('Failed to save affiliate referral:', err);
                    }
                }
            }
        }

        // Send welcome email (non-blocking)
        sendWelcomeEmail({ email: user.email, firstName: user.firstName, role: user.role }).catch(console.error);

        return NextResponse.json(
            { message: 'Account created successfully', user },
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
