import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const isActive = await getSetting('GLOBAL_ANNOUNCEMENT_ACTIVE');
        const text = await getSetting('GLOBAL_ANNOUNCEMENT_TEXT');
        
        if (String(isActive).toLowerCase() === 'true' && text) {
            return NextResponse.json({ active: true, text });
        }
        
        return NextResponse.json({ active: false });
    } catch (error) {
        return NextResponse.json({ active: false });
    }
}
