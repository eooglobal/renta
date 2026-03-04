import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/notifications — Fetch current user's notifications
export async function GET(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const onlyUnread = searchParams.get('unread') === 'true';

        const where = { userId: parseInt(session.user.id) };
        if (onlyUnread) where.isRead = false;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: parseInt(session.user.id), isRead: false }
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Notifications fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH /api/notifications — Mark notifications as read
export async function PATCH(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { notificationId, all } = body;

        const userId = parseInt(session.user.id);

        if (all) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
        } else if (notificationId) {
            // Mark specific as read
            await prisma.notification.update({
                where: { id: parseInt(notificationId), userId },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ message: 'Notifications updated' });
    } catch (error) {
        console.error('Notifications update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
