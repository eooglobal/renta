import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateSetting } from '@/lib/settings';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { active, text } = await req.json();

        await updateSetting('GLOBAL_ANNOUNCEMENT_ACTIVE', String(active));
        await updateSetting('GLOBAL_ANNOUNCEMENT_TEXT', text || '');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Announcement update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
