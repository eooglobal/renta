import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

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

        const secret = await getSetting('PAYSTACK_SECRET_KEY');
        if (!secret) {
            return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
        }

        const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${secret}` },
        });

        const data = await res.json();

        if (!res.ok || !data.status) {
            return NextResponse.json(
                { error: data.message || 'Could not resolve account — check account number and bank' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            account_name:   data.data.account_name,
            account_number: data.data.account_number,
            bank_id:        data.data.bank_id,
        });
    } catch (error) {
        console.error('[Banks Resolve API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
