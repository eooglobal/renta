import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
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
                // In NextAuth's authorize, we don't naturally get the raw IP. 
                // Using the email address as the primary token to block brute-force on a single account
                const { checkRateLimit } = await import('@/lib/rate-limiter');
                const rateLimit = await checkRateLimit(credentials.email, 'login', 5, 15 * 60 * 1000); // 5 attempts per 15 mins
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
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.adminRole = user.adminRole;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.ninStatus = user.ninStatus;
                token.status = user.status;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.adminRole = token.adminRole;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.ninStatus = token.ninStatus;
                session.user.status = token.status;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
});
