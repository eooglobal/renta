import { getSetting } from '@/lib/settings';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const settings = {
            NEXT_PUBLIC_PUSHER_KEY: await getSetting('NEXT_PUBLIC_PUSHER_KEY'),
            NEXT_PUBLIC_PUSHER_CLUSTER: await getSetting('NEXT_PUBLIC_PUSHER_CLUSTER'),
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: await getSetting('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching public settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
