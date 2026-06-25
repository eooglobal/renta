import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

// Module-level cache
let banksCache = null;
let banksCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// GET /api/banks — Fetch Nigerian bank list from Paystack
export async function GET() {
    try {
        const now = Date.now();
        if (banksCache && now - banksCacheTime < CACHE_TTL) {
            return NextResponse.json(banksCache);
        }

        const secret = await getSetting('PAYSTACK_SECRET_KEY');
        if (!secret) {
            return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
        }

        const res = await fetch('https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=100', {
            headers: { Authorization: `Bearer ${secret}` },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch bank list' }, { status: 502 });
        }

        const data = await res.json();
        const banks = (data.data || []).map(b => ({
            name: b.name,
            code: b.code,
            id: b.id,
        })).sort((a, b) => a.name.localeCompare(b.name));

        banksCache = banks;
        banksCacheTime = now;

        return NextResponse.json(banks);
    } catch (error) {
        console.error('[Banks API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
