import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

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

        // Send emails asynchronously
        // We do this in a background loop so we don't block the API response for too long
        const emailPromises = users.map(user => 
            sendEmail(user.email, subject, body, `Hello ${user.firstName},<br><br>${body}`)
                .catch(err => console.error(`Failed to send email to ${user.email}:`, err))
        );

        // Wait for all to dispatch (if ZeptoMail or Nodemailer is quick enough)
        await Promise.all(emailPromises);

        return NextResponse.json({ success: true, count: users.length });
    } catch (error) {
        console.error('Email dispatcher error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
