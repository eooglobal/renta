import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { authConfig } from '@/lib/auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                // --- Rate Limiting ---
                const { checkRateLimit } = await import('@/lib/rate-limiter');
                const rateLimit = await checkRateLimit(credentials.email, 'login', 5, 15 * 60 * 1000, { failClosed: true });
                if (!rateLimit.success) {
                    throw new Error(rateLimit.message);
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                if (user.status !== 'ACTIVE') {
                    throw new Error('Your account has been suspended. Contact support.');
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    throw new Error('Invalid email or password');
                }

                // Check if account needs 6-digit OTP verification
                if (!user.isVerified && user.role !== 'ADMIN') {
                    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
                    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { otpCode, otpExpiresAt }
                    });
                    const { dispatchOtpNotification } = await import('@/lib/notificationDispatcher');
                    dispatchOtpNotification({ id: user.id, email: user.email, firstName: user.firstName, phone: user.phone }, otpCode).catch(console.error);

                    throw new Error(`UNVERIFIED_OTP:${user.email}`);
                }

                return {
                    id: String(user.id),
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    adminRole: user.adminRole,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    ninStatus: user.ninStatus,
                    status: user.status,
                    isVerified: Boolean(user.isVerified),
                };
            },
        }),
    ],
});
