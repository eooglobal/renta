import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { clearSettingsCache, checkPlatformHealth } from '@/lib/settings';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.platformSetting.findMany({
            orderBy: { group: 'asc' }
        });

        const health = await checkPlatformHealth();

        return NextResponse.json({ settings, health });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

        const setting = await prisma.platformSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value, group: 'GENERAL', label: key }
        });

        clearSettingsCache();

        return NextResponse.json({ message: 'Setting updated successfully', setting });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
