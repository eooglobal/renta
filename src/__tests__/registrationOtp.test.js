import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as verifyOtpHandler } from '@/app/api/auth/verify-otp/route';
import { POST as resendOtpHandler } from '@/app/api/auth/resend-otp/route';
import { prisma } from '@/lib/db';

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@/lib/rate-limiter', () => ({
    checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/notificationDispatcher', () => ({
    dispatchWelcomeNotification: jest.fn().mockResolvedValue({}),
    dispatchOtpNotification: jest.fn().mockResolvedValue({ email: { success: true }, sms: { success: true } }),
}));

describe('6-Digit Registration OTP Verification Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Registration creates user with 6-digit OTP code and returns requiresOtp: true', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockImplementation(({ data }) => Promise.resolve({
            id: 42,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            isVerified: data.isVerified,
            otpCode: data.otpCode,
            otpExpiresAt: data.otpExpiresAt,
        }));

        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'Jane',
                lastName: 'Doe',
                role: 'TENANT',
            }),
        });

        const res = await registerHandler(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.requiresOtp).toBe(true);
        expect(data.email).toBe('newuser@example.com');
        expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                isVerified: false,
                otpCode: expect.stringMatching(/^\d{6}$/),
            }),
        }));
    });

    test('verify-otp API marks account as verified for correct 6-digit code', async () => {
        const mockUser = {
            id: 42,
            email: 'jane@example.com',
            isVerified: false,
            otpCode: '482910',
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            role: 'TENANT',
        };

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue({ ...mockUser, isVerified: true, otpCode: null });

        const req = new Request('http://localhost/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({
                email: 'jane@example.com',
                otpCode: '482910',
            }),
        });

        const res = await verifyOtpHandler(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 42 },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null,
            },
        });
    });

    test('verify-otp API rejects invalid 6-digit code', async () => {
        const mockUser = {
            id: 42,
            email: 'jane@example.com',
            isVerified: false,
            otpCode: '482910',
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            role: 'TENANT',
        };

        prisma.user.findUnique.mockResolvedValue(mockUser);

        const req = new Request('http://localhost/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({
                email: 'jane@example.com',
                otpCode: '999999',
            }),
        });

        const res = await verifyOtpHandler(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Invalid 6-digit verification code');
    });

    test('verify-otp API rejects expired OTP code', async () => {
        const mockUser = {
            id: 42,
            email: 'jane@example.com',
            isVerified: false,
            otpCode: '482910',
            otpExpiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
            role: 'TENANT',
        };

        prisma.user.findUnique.mockResolvedValue(mockUser);

        const req = new Request('http://localhost/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({
                email: 'jane@example.com',
                otpCode: '482910',
            }),
        });

        const res = await verifyOtpHandler(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Verification code has expired');
    });

    test('resend-otp API generates new 6-digit code and dispatches notifications', async () => {
        const mockUser = {
            id: 42,
            email: 'jane@example.com',
            firstName: 'Jane',
            phone: '08012345678',
            isVerified: false,
        };

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue(mockUser);

        const req = new Request('http://localhost/api/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({
                email: 'jane@example.com',
            }),
        });

        const res = await resendOtpHandler(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 42 },
            data: expect.objectContaining({
                otpCode: expect.stringMatching(/^\d{6}$/),
            }),
        }));
    });
});
