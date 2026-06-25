import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendPaymentConfirmation,
    sendEscrowReleaseEmail,
    sendPropertyVerifiedEmail,
    sendCommissionEarnedEmail,
} from '@/lib/email';

// POST /api/admin/test-email — Send a test email using a specific template
export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { to, template } = await request.json();

        if (!to || !template) {
            return NextResponse.json({ error: 'Email address and template are required' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';

        const dummyUser = { firstName: 'Test', lastName: 'User', email: to, role: 'TENANT' };
        const dummyProperty = { title: 'Modern 2-Bedroom Flat, Tanke GRA', address: '12 Afonja Street, Tanke, Ilorin' };
        const dummyRental = { id: 999, rentAmount: 350000, serviceFee: 35000, totalPaid: 385000 };

        let result;
        switch (template) {
            case 'welcome':
                result = await sendWelcomeEmail(dummyUser);
                break;
            case 'payment_confirmation':
                result = await sendPaymentConfirmation({ tenant: dummyUser, property: dummyProperty, rental: dummyRental });
                break;
            case 'escrow_release':
                result = await sendEscrowReleaseEmail({ landlord: dummyUser, property: dummyProperty, rental: dummyRental });
                break;
            case 'property_verified':
                result = await sendPropertyVerifiedEmail({ landlord: dummyUser, property: dummyProperty });
                break;
            case 'commission_earned':
                result = await sendCommissionEarnedEmail(dummyUser, 17500, 'SCOUT');
                break;
            default:
                return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 });
        }

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Email failed to send' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Test email (${template}) sent to ${to}` });
    } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }
}
