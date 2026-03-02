import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        let wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!wallet) {
            // Create a wallet if it doesn't exist
            wallet = await prisma.wallet.create({
                data: {
                    userId,
                    balance: 0,
                    totalEarned: 0,
                    totalWithdrawn: 0
                },
                include: {
                    transactions: true
                }
            });
        }

        return NextResponse.json(wallet);
    } catch (error) {
        console.error('Wallet error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
