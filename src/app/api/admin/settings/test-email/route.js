import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
        }

        const adminEmail = session.user.email;
        if (!adminEmail) {
            return NextResponse.json({ error: 'Logged in admin has no email address' }, { status: 400 });
        }

        const subject = '⚡ Renta Email Integration Test';
        const html = `
            <h2 style="margin:0 0 12px;color:#000;">Email Integration Test Successful! 🎉</h2>
            <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.5;">
                This test email confirms that your email provider credentials and settings are correctly configured on <strong>Renta</strong>.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;color:#166534;font-size:14px;margin-bottom:16px;">
                ✓ Transactional email service is fully operational.
            </div>
        `;

        const result = await sendEmail({ to: adminEmail, subject, html });

        if (result && result.success) {
            return NextResponse.json({
                success: true,
                provider: result.provider,
                messageId: result.messageId,
                message: `Test email successfully delivered to ${adminEmail} via ${result.provider.toUpperCase()}.`,
            });
        } else {
            return NextResponse.json({
                success: false,
                provider: result?.provider || 'unknown',
                error: result?.error || 'Failed to send test email. Please verify settings.',
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Test email route error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error during email test',
        }, { status: 500 });
    }
}
