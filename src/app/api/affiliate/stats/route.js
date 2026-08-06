import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const affiliateId = parseInt(session.user.id);

    const [clickAggregation, conversions, wallet] = await Promise.all([
      prisma.affiliateReferral.aggregate({
        where: { affiliateId },
        _sum: { clicks: true },
      }),
      prisma.rental.count({
        where: {
          affiliateReferral: { affiliateId },
          status: { in: ['ACTIVE', 'COMPLETED', 'DISPUTED'] }
        },
      }),
      prisma.wallet.findUnique({
        where: { userId: affiliateId },
        select: { totalEarned: true },
      }),
    ]);

    return NextResponse.json({
      totalClicks: clickAggregation._sum.clicks || 0,
      conversions,
      totalEarnings: wallet?.totalEarned || 0,
    });
  } catch (error) {
    console.error('Affiliate stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
