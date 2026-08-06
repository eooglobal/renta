import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'SCOUT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scoutId = parseInt(session.user.id);

    const [leadsSubmitted, verifiedProperties, totalEarnings] = await Promise.all([
      prisma.scoutLead.count({ where: { scoutId } }),
      prisma.scoutLead.count({
        where: {
          scoutId,
          properties: {
            some: {
              verificationStatus: 'VERIFIED',
            },
          },
        },
      }),
      prisma.wallet.findUnique({
        where: { userId: scoutId },
        select: { totalEarned: true },
      }),
    ]);

    return NextResponse.json({
      leadsSubmitted,
      verifiedProperties,
      totalEarnings: totalEarnings?.totalEarned || 0,
    });
  } catch (error) {
    console.error('Scout stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
