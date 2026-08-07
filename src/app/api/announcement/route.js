import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const isActive = await getSetting('GLOBAL_ANNOUNCEMENT_ACTIVE');
        const text = await getSetting('GLOBAL_ANNOUNCEMENT_TEXT');
        const active = String(isActive).toLowerCase() === 'true';
        
        return NextResponse.json({ active, text: text || '' });
    } catch (error) {
        return NextResponse.json({ active: false, text: '' });
    }
}
