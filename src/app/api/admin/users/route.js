import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/admin/users — List all users
export async function GET(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = {};
        if (role) where.role = role;
        if (status) where.status = status;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true, email: true, phone: true, firstName: true, lastName: true,
                    role: true, adminRole: true, ninStatus: true, status: true, createdAt: true,
                    _count: { select: { properties: true, rentals: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// PATCH /api/admin/users — Suspend/activate/blacklist user
export async function PATCH(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, action } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'User ID and action required' }, { status: 400 });
        }

        const validActions = {
            activate: 'ACTIVE',
            suspend: 'SUSPENDED',
            blacklist: 'BLACKLISTED',
        };

        if (!validActions[action]) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Prevent self-action
        if (userId === parseInt(session.user.id)) {
            return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { status: validActions[action] },
            select: { id: true, email: true, firstName: true, lastName: true, status: true },
        });

        return NextResponse.json({
            message: `User ${action}d successfully`,
            user: updated,
        });
    } catch (error) {
        console.error('Admin user action error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
