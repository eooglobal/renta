import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { auth } from '@/lib/auth';

export async function GET(request) {
    try {
        // Simple security check: Only logged in users (or even better, Admins) should trigger this
        const session = await auth();

        // Temporarily allowing if no session for ease of debugging on first deploy, 
        // but logging the action.
        console.log('Email test triggered. Session:', session?.user?.email || 'No Session');

        const testEmail = session?.user?.email || 'onboarding@resend.dev';

        console.log(`Sending diagnostic email to: ${testEmail}`);

        const result = await sendEmail({
            to: testEmail,
            subject: 'Renta Diagnostic: System Test',
            html: `
                <h1>Email Diagnostic</h1>
                <p>This is a test email triggered from the Renta diagnostic route.</p>
                <ul>
                    <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                    <li><strong>Recipient:</strong> ${testEmail}</li>
                    <li><strong>Provider:</strong> Resend (SMTP)</li>
                </ul>
                <p>If you received this, your SMTP configuration is correct!</p>
            `
        });

        return NextResponse.json({
            message: 'Diagnostic process completed',
            result,
            details: {
                recipient: testEmail,
                smtp_config_present: !!process.env.SMTP_HOST,
                env_from: process.env.EMAIL_FROM
            }
        });
    } catch (error) {
        console.error('Diagnostic route error:', error);
        return NextResponse.json({
            error: 'Diagnostic failed',
            details: error.message
        }, { status: 500 });
    }
}
