import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/admin/settings — List all platform settings
export async function GET(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const settings = await prisma.platformSetting.findMany({
            orderBy: [{ group: 'asc' }, { id: 'asc' }],
        });

        // Group settings by category
        const grouped = settings.reduce((acc, setting) => {
            if (!acc[setting.group]) acc[setting.group] = [];
            acc[setting.group].push(setting);
            return acc;
        }, {});

        return NextResponse.json({ settings: grouped });
    } catch (error) {
        console.error('Settings fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT /api/admin/settings — Update a setting (Super Admin only)
export async function PUT(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Only Super Admin can edit settings
        if (session.user.adminRole !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Only Super Admins can modify settings' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined || value === null) {
            return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
        }

        const setting = await prisma.platformSetting.findUnique({ where: { key } });
        if (!setting) {
            return NextResponse.json({ error: `Setting '${key}' does not exist` }, { status: 404 });
        }

        // Type validation
        if (setting.type === 'number' && isNaN(Number(value))) {
            return NextResponse.json({ error: `Value for '${key}' must be a number` }, { status: 400 });
        }

        const updated = await prisma.platformSetting.update({
            where: { key },
            data: { value: String(value) },
        });

        return NextResponse.json({ message: 'Setting updated', setting: updated });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
