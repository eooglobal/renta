import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { active, text } = await req.json();

        // Upsert both settings using Prisma directly
        await Promise.all([
            prisma.platformSetting.upsert({
                where: { key: 'GLOBAL_ANNOUNCEMENT_ACTIVE' },
                update: { value: String(active) },
                create: {
                    key: 'GLOBAL_ANNOUNCEMENT_ACTIVE',
                    value: String(active),
                    label: 'Global Announcement Active',
                    group: 'announcements',
                    type: 'boolean',
                },
            }),
            prisma.platformSetting.upsert({
                where: { key: 'GLOBAL_ANNOUNCEMENT_TEXT' },
                update: { value: text || '' },
                create: {
                    key: 'GLOBAL_ANNOUNCEMENT_TEXT',
                    value: text || '',
                    label: 'Global Announcement Text',
                    group: 'announcements',
                    type: 'string',
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Announcement update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
