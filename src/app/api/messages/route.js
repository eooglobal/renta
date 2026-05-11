import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

// GET: Fetch conversations (grouped by the other party)
export async function GET(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = parseInt(session.user.id);
        const { searchParams } = new URL(request.url);
        const withUserId = searchParams.get('withUserId');

        // If withUserId is provided, return the full thread
        if (withUserId) {
            const otherId = parseInt(withUserId);
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId, receiverId: otherId },
                        { senderId: otherId, receiverId: userId },
                    ]
                },
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: { select: { id: true, firstName: true, lastName: true, role: true } },
                }
            });

            // Mark unread messages as read
            await prisma.message.updateMany({
                where: { senderId: otherId, receiverId: userId, isRead: false },
                data: { isRead: true }
            });

            return NextResponse.json(messages);
        }

        // Otherwise, return conversation list (unique contacts)
        const sentMessages = await prisma.message.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        const receivedMessages = await prisma.message.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        // Collect unique contact IDs
        const contactIds = [...new Set([
            ...sentMessages.map(m => m.receiverId),
            ...receivedMessages.map(m => m.senderId),
        ])];

        // For each contact, get their info and the latest message
        const conversations = await Promise.all(
            contactIds.map(async (contactId) => {
                const contact = await prisma.user.findUnique({
                    where: { id: contactId },
                    select: { id: true, firstName: true, lastName: true, role: true, avatar: true }
                });

                const lastMessage = await prisma.message.findFirst({
                    where: {
                        OR: [
                            { senderId: userId, receiverId: contactId },
                            { senderId: contactId, receiverId: userId },
                        ]
                    },
                    orderBy: { createdAt: 'desc' },
                });

                const unreadCount = await prisma.message.count({
                    where: { senderId: contactId, receiverId: userId, isRead: false }
                });

                return {
                    contact,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        // Sort by latest message
        conversations.sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));

        return NextResponse.json(conversations);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Send a new message
export async function POST(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { receiverId, content, rentalId } = body;

        if (!receiverId || !content?.trim()) {
            return NextResponse.json({ error: 'Receiver and message content are required' }, { status: 400 });
        }

        // Verify receiver exists
        const receiver = await prisma.user.findUnique({ where: { id: parseInt(receiverId) } });
        if (!receiver) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        const message = await prisma.message.create({
            data: {
                senderId: parseInt(session.user.id),
                receiverId: parseInt(receiverId),
                content: content.trim(),
                rentalId: rentalId ? parseInt(rentalId) : null,
            },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true, role: true } },
            }
        });

        // Notify Receiver via Pusher (Real-time)
        try {
            const { getPusherServer } = await import('@/lib/pusher');
            const pusher = await getPusherServer();
            await pusher.trigger(
                `user-${receiverId}`,
                'new-message',
                message
            );
        } catch (pusherError) {
            console.error('Pusher trigger failed:', pusherError);
        }

        // Notify Receiver (Persistent Notification)
        createNotification(receiverId, {
            type: 'MESSAGE',
            title: `New message from ${message.sender.firstName}`,
            message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            link: `/${session.user.role.toLowerCase()}/messages?withUserId=${session.user.id}`
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
