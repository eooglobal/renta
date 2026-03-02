import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const leads = await prisma.scoutLead.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                scout: { select: { id: true, firstName: true, lastName: true, phone: true } },
                properties: { select: { id: true, status: true, title: true } }
            }
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error('Failed to fetch all scout leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
