import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { audience, subject, body } = await req.json();

        if (!subject || !body) {
            return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
        }

        // Fetch target users
        let whereClause = {};
        if (audience !== 'ALL') {
            whereClause.role = audience;
        }

        const users = await prisma.user.findMany({
            where: {
                ...whereClause,
                status: 'ACTIVE' // only send to active users
            },
            select: { email: true, firstName: true }
        });

        if (users.length === 0) {
            return NextResponse.json({ error: 'No users found for this audience' }, { status: 404 });
        }

        // Send emails, catching individual failures so one bad address won't stop the rest
        const emailPromises = users.map(user =>
            sendEmail(user.email, subject, body, `Hello ${user.firstName},<br><br>${body}`)
                .catch(err => console.error(`Failed to send email to ${user.email}:`, err))
        );

        await Promise.all(emailPromises);

        return NextResponse.json({ success: true, count: users.length });
    } catch (error) {
        console.error('Bulk email error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
