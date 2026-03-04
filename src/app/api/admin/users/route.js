import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET /api/admin/users — List all users
export async function GET(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const adminRole = session.user.adminRole;
        if (adminRole === 'VERIFICATION_OFFICER') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = {};
        if (role) where.role = role;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
            ];
        }

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

// POST /api/admin/users — Create a new user (Super Admin only)
export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        if (session.user.adminRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Only Super Admins can create users' }, { status: 403 });
        }

        const body = await request.json();
        const { firstName, lastName, email, phone, password, role, adminRole } = body;

        if (!firstName || !lastName || !email || !password || !role) {
            return NextResponse.json({ error: 'First name, last name, email, password, and role are required' }, { status: 400 });
        }

        // Check for duplicate email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phone: phone || null,
                passwordHash,
                role,
                adminRole: role === 'ADMIN' ? (adminRole || 'SUPPORT') : null,
                status: 'ACTIVE',
            },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, adminRole: true },
        });

        return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

// PATCH /api/admin/users — Update user status, role, or profile
export async function PATCH(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const adminRole = session.user.adminRole;
        if (adminRole === 'VERIFICATION_OFFICER') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, action, role, adminRole: newAdminRole, firstName, lastName, email, phone } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-modification
        if (userId === parseInt(session.user.id)) {
            return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
        }

        const updateData = {};

        // Handle status actions
        if (action) {
            const validActions = { activate: 'ACTIVE', suspend: 'SUSPENDED', blacklist: 'BLACKLISTED' };
            if (!validActions[action]) {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }
            updateData.status = validActions[action];
        }

        // Handle role change (Super Admin only)
        if (role) {
            if (adminRole !== 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Only Super Admins can change roles' }, { status: 403 });
            }
            updateData.role = role;
            // Set or clear admin role based on the new role
            if (role === 'ADMIN') {
                updateData.adminRole = newAdminRole || 'SUPPORT';
            } else {
                updateData.adminRole = null;
            }
        }

        // Handle admin role change
        if (newAdminRole && !role) {
            if (adminRole !== 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Only Super Admins can change admin roles' }, { status: 403 });
            }
            updateData.adminRole = newAdminRole;
        }

        // Handle profile updates
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone || null;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, email: true, firstName: true, lastName: true, role: true, adminRole: true, status: true },
        });

        return NextResponse.json({ message: 'User updated successfully', user: updated });
    } catch (error) {
        console.error('Admin user action error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/admin/users — Delete a user (Super Admin only)
export async function DELETE(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        if (session.user.adminRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Only Super Admins can delete users' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = parseInt(searchParams.get('userId'));

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === parseInt(session.user.id)) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Check if user has active properties or rentals
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { _count: { select: { properties: true, rentals: true } } },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user._count.properties > 0 || user._count.rentals > 0) {
            return NextResponse.json({
                error: `Cannot delete: user has ${user._count.properties} properties and ${user._count.rentals} rentals. Suspend this account instead.`
            }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
