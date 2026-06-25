import { NextResponse } from 'next/server';
import { resolveAccount } from '@/lib/paymentGateway';

// GET /api/banks/resolve?account_number=XXXXXXXXXX&bank_code=XXX
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountNumber = searchParams.get('account_number');
        const bankCode      = searchParams.get('bank_code');

        if (!accountNumber || !bankCode) {
            return NextResponse.json({ error: 'account_number and bank_code are required' }, { status: 400 });
        }

        if (accountNumber.length !== 10) {
            return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 });
        }

        const data = await resolveAccount(accountNumber, bankCode);

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Banks Resolve API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

