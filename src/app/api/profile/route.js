import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET: Fetch current user's profile
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                ninNumber: true,
                ninStatus: true,
                bankName: true,
                bankAccount: true,
                bankCode: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Mask NIN for security (show last 4 digits only)
        if (user.ninNumber) {
            user.ninNumber = '***-***-' + user.ninNumber.slice(-4);
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update current user's profile
export async function PUT(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, bankName, bankAccount, bankCode, currentPassword, newPassword } = body;

        const userId = parseInt(session.user.id);

        // Build the update data object dynamically
        const updateData = {};

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone || null;
        if (bankName !== undefined) updateData.bankName = bankName || null;
        if (bankAccount !== undefined) updateData.bankAccount = bankAccount || null;
        if (bankCode !== undefined) updateData.bankCode = bankCode || null;

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
            }

            // Verify current password
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
            }

            if (newPassword.length < 8) {
                return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
            }

            updateData.passwordHash = await bcrypt.hash(newPassword, 12);
        }

        // Check phone uniqueness if updating
        if (phone) {
            const existingPhone = await prisma.user.findUnique({ where: { phone } });
            if (existingPhone && existingPhone.id !== userId) {
                return NextResponse.json({ error: 'This phone number is already in use' }, { status: 409 });
            }
        }

        // --- Suspicious Bank Update Fraud Check ---
        if (updateData.bankAccount || updateData.bankCode) {
            const { checkSuspiciousBankUpdate } = await import('@/lib/fraudRules');
            const isFraudulent = await checkSuspiciousBankUpdate(userId);

            if (isFraudulent) {
                return NextResponse.json(
                    { error: 'Account suspended due to suspicious activity (Bank details changed during pending withdrawal).' },
                    { status: 403 }
                );
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                bankName: true,
                bankAccount: true,
                role: true,
            }
        });

        return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
