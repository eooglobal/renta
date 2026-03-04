import { prisma } from './db';

/**
 * Creates a notification in the database for a specific user.
 * 
 * @param {number} userId - ID of the user to receive the notification
 * @param {Object} data - Notification details
 * @param {string} data.type - Category (e.g., 'INSPECTION', 'PAYMENT', 'VERIFICATION')
 * @param {string} data.title - Short summary
 * @param {string} data.message - Detailed notification content
 * @param {string} [data.link] - Optional URL to redirect the user
 */
export async function createNotification(userId, { type, title, message, link }) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: parseInt(userId),
                type,
                title,
                message,
                link: link || null,
                isRead: false
            }
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // We don't throw here to avoid breaking the calling workflow 
        // if notifications fail for some reason.
        return null;
    }
}
