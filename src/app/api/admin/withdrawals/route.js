import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const withdrawals = await prisma.withdrawalRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                wallet: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, role: true, phone: true, email: true } }
                    }
                }
            }
        });

        return NextResponse.json(withdrawals);
    } catch (error) {
        console.error('Failed to fetch withdrawal requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
