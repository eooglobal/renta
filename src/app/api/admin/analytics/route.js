import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Revenue over last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const rentals = await prisma.rental.findMany({
            where: { createdAt: { gte: sixMonthsAgo }, status: 'ACTIVE' },
            select: { totalPaid: true, createdAt: true }
        });

        // Group by month
        const revenueByMonth = rentals.reduce((acc, rental) => {
            const month = rental.createdAt.toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + Number(rental.totalPaid);
            return acc;
        }, {});

        const revenueChartData = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue }));

        // 2. Fetch User Growth
        const users = await prisma.user.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { role: true, createdAt: true }
        });

        const userGrowth = users.reduce((acc, user) => {
            const month = user.createdAt.toLocaleString('default', { month: 'short' });
            if (!acc[month]) acc[month] = { name: month, Tenants: 0, Landlords: 0 };
            if (user.role === 'TENANT') acc[month].Tenants++;
            if (user.role === 'LANDLORD') acc[month].Landlords++;
            return acc;
        }, {});

        const userChartData = Object.values(userGrowth);

        // 3. Property Status Distribution
        const properties = await prisma.property.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const propertyData = properties.map(p => ({ name: p.status, value: p._count.id }));

        return NextResponse.json({
            revenue: revenueChartData,
            users: userChartData,
            properties: propertyData
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
