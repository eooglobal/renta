import { prisma } from '@/lib/db';

/**
 * Basic Database-backed Rate Limiter
 * @param {string} ip - The client's IP address
 * @param {string} endpoint - The name of the endpoint being rate limited
 * @param {number} maxRequests - Maximum allowed requests in the window
 * @param {number} windowMs - The time window in milliseconds
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function checkRateLimit(ip, endpoint, maxRequests = 5, windowMs = 60000) {
    if (!ip) return { success: true, message: 'No IP provided' };

    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + windowMs);

        // Find existing rate limit record
        const record = await prisma.rateLimit.findUnique({
            where: {
                ip_endpoint: {
                    ip,
                    endpoint
                }
            }
        });

        if (!record) {
            // Create a new record for this IP and endpoint
            await prisma.rateLimit.create({
                data: {
                    ip,
                    endpoint,
                    count: 1,
                    expiresAt
                }
            });
            return { success: true, message: 'Rate limit OK' };
        }

        // Check if the current window has expired
        if (now > record.expiresAt) {
            // Reset the counter
            await prisma.rateLimit.update({
                where: { id: record.id },
                data: {
                    count: 1,
                    expiresAt
                }
            });
            return { success: true, message: 'Rate limit reset' };
        }

        // Window is still active. Check count.
        if (record.count >= maxRequests) {
            return { success: false, message: 'Too many requests. Please try again later.' };
        }

        // Increment count
        await prisma.rateLimit.update({
            where: { id: record.id },
            data: {
                count: record.count + 1
            }
        });

        return { success: true, message: 'Rate limit OK' };

    } catch (error) {
        console.error('Rate Limiter Error:', error);
        // Fail open in case of DB errors so we don't break the app
        return { success: true, message: 'Rate limiter error, bypassing' };
    }
}
