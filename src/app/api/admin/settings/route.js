import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { clearSettingsCache, checkPlatformHealth, getMergedSettings } from '@/lib/settings';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the merged view: DB values take priority, env vars fill gaps
        const merged = await getMergedSettings();

        // Also return raw DB rows so the UI knows which keys are DB-saved
        const dbRows = await prisma.platformSetting.findMany({
            orderBy: { group: 'asc' }
        });

        // Build the settings array the UI expects: for each merged key,
        // return { key, value, source } — source tells the UI where the value came from
        const settings = Object.entries(merged).map(([key, { value, source }]) => ({
            key,
            value,
            source, // 'db' or 'env'
        }));

        // Include DB rows that exist but have empty/placeholder values (so the UI can show them)
        const mergedKeys = new Set(Object.keys(merged));
        for (const row of dbRows) {
            if (!mergedKeys.has(row.key)) {
                settings.push({ key: row.key, value: row.value || '', source: 'db' });
            }
        }

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

        // Always save to DB — this is the authoritative override for any env var
        const setting = await prisma.platformSetting.upsert({
            where: { key },
            update: { value: value ?? '' },
            create: { key, value: value ?? '', group: 'GENERAL', label: key }
        });

        // Clear cache so getSetting picks up the new DB value immediately
        clearSettingsCache();

        return NextResponse.json({ message: 'Setting updated successfully', setting });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
