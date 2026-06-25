import { NextResponse } from 'next/server';
import { getBanks } from '@/lib/paymentGateway';

// Module-level cache
let banksCache = null;
let banksCacheTime = 0;
let cachedGateway = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// GET /api/banks — Fetch Nigerian bank list from Active Gateway
export async function GET() {
    try {
        const now = Date.now();
        const { getActiveGateway } = await import('@/lib/paymentGateway');
        const activeGateway = await getActiveGateway();

        if (banksCache && cachedGateway === activeGateway && now - banksCacheTime < CACHE_TTL) {
            return NextResponse.json(banksCache);
        }

        const banks = await getBanks();

        banksCache = banks;
        banksCacheTime = now;
        cachedGateway = activeGateway;

        return NextResponse.json(banks);
    } catch (error) {
        console.error('[Banks API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

